package dockercollector

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/rs/zerolog"

	"github.com/RCooLeR/UgosBridge/bridge/internal/dockerapi"
	"github.com/RCooLeR/UgosBridge/bridge/internal/model"
)

type DockerClient interface {
	ListContainers(ctx context.Context, includeSize bool) ([]dockerapi.ContainerSummary, error)
	ContainerStats(ctx context.Context, containerID string) (dockerapi.ContainerStats, error)
	ContainerInspect(ctx context.Context, containerID string) (dockerapi.ContainerInspect, error)
	ContainerOOMEvents(ctx context.Context, since time.Time, until time.Time) ([]dockerapi.ContainerEvent, error)
}

type Config struct {
	ProjectLabel           string
	StandaloneProjectName  string
	ContainerConcurrency   int
	DetailedContainerStats bool
	Log                    zerolog.Logger
}

type Collector struct {
	client              DockerClient
	cfg                 Config
	oomEventsMu         sync.Mutex
	oomEventsByID       map[string]uint64
	lastOOMEventsLookup time.Time
}

func New(client DockerClient, cfg Config) *Collector {
	if cfg.ProjectLabel == "" {
		cfg.ProjectLabel = "com.docker.compose.project"
	}
	if cfg.StandaloneProjectName == "" {
		cfg.StandaloneProjectName = "standalone"
	}
	if cfg.ContainerConcurrency < 1 {
		cfg.ContainerConcurrency = 1
	}

	collector := &Collector{
		client: client,
		cfg:    cfg,
	}
	if cfg.DetailedContainerStats {
		collector.oomEventsByID = make(map[string]uint64)
		collector.lastOOMEventsLookup = time.Now().UTC()
	}
	return collector
}

func (c *Collector) Collect(ctx context.Context) (model.Snapshot, error) {
	collectedAt := time.Now().UTC()
	var (
		oomEvents map[string]uint64
		oomErr    error
	)
	if c.cfg.DetailedContainerStats {
		oomEvents, oomErr = c.collectOOMEvents(ctx, collectedAt)
	}
	containers, err := c.client.ListContainers(ctx, c.cfg.DetailedContainerStats)
	if err != nil {
		return model.Snapshot{CollectedAt: collectedAt}, err
	}

	result := make([]model.ContainerSnapshot, len(containers))
	sem := make(chan struct{}, c.cfg.ContainerConcurrency)
	var wg sync.WaitGroup
	var errorMu sync.Mutex
	var statsErrors []string

	for idx, container := range containers {
		wg.Go(func() {
			sem <- struct{}{}
			defer func() { <-sem }()

			snapshot := model.ContainerSnapshot{
				ID:      container.ID,
				Name:    normalizeContainerName(container.ID, container.Names),
				Project: projectName(container.Labels, c.cfg.ProjectLabel, c.cfg.StandaloneProjectName),
				Image:   container.Image,
				State:   container.State,
				Status:  container.Status,
				Running: strings.EqualFold(container.State, "running"),
			}

			stats, statsErr := c.client.ContainerStats(ctx, container.ID)
			if statsErr != nil {
				errorMu.Lock()
				statsErrors = append(statsErrors, fmt.Sprintf("%s: %v", snapshot.Name, statsErr))
				errorMu.Unlock()
				result[idx] = snapshot
				return
			}

			snapshot.CPUPercent = cpuPercent(stats)
			snapshot.MemoryUsageBytes = memoryUsageBytes(stats.MemoryStats)
			snapshot.MemoryLimitBytes = stats.MemoryStats.Limit
			if c.cfg.DetailedContainerStats {
				detailed := detailedSnapshot(container, stats)
				detailed.OOMEvents = oomEvents[container.ID]
				inspect, inspectErr := c.client.ContainerInspect(ctx, container.ID)
				if inspectErr != nil {
					errorMu.Lock()
					statsErrors = append(statsErrors, fmt.Sprintf("%s inspect: %v", snapshot.Name, inspectErr))
					errorMu.Unlock()
				} else {
					applyInspectDetails(&detailed, inspect)
				}
				snapshot.Detailed = &detailed
			}
			snapshot.StatsCollected = true
			result[idx] = snapshot
		})
	}

	wg.Wait()

	sort.Slice(result, func(i, j int) bool {
		if result[i].Project == result[j].Project {
			return result[i].Name < result[j].Name
		}
		return result[i].Project < result[j].Project
	})

	snapshot := model.Snapshot{
		CollectedAt:         collectedAt,
		Containers:          result,
		Projects:            aggregateProjects(result),
		ContainerStatsError: len(statsErrors),
	}

	if len(statsErrors) > 0 {
		c.cfg.Log.Warn().Int("containers_failed", len(statsErrors)).Msg("partial container stats collection")
	}

	if oomErr != nil {
		c.cfg.Log.Warn().Err(oomErr).Msg("failed to refresh container oom events")
	}

	return snapshot, nil
}

func (c *Collector) collectOOMEvents(ctx context.Context, collectedAt time.Time) (map[string]uint64, error) {
	c.oomEventsMu.Lock()
	defer c.oomEventsMu.Unlock()

	events, err := c.client.ContainerOOMEvents(ctx, c.lastOOMEventsLookup, collectedAt)
	if err != nil {
		return cloneOOMEvents(c.oomEventsByID), err
	}
	for _, event := range events {
		if event.Actor.ID == "" {
			continue
		}
		c.oomEventsByID[event.Actor.ID]++
	}
	c.lastOOMEventsLookup = collectedAt
	return cloneOOMEvents(c.oomEventsByID), nil
}

func aggregateProjects(containers []model.ContainerSnapshot) []model.ProjectSnapshot {
	projects := make(map[string]*model.ProjectSnapshot)
	for _, container := range containers {
		project := projects[container.Project]
		if project == nil {
			project = &model.ProjectSnapshot{Name: container.Project}
			projects[container.Project] = project
		}

		project.TotalContainers++
		if container.Running {
			project.RunningContainers++
		}
		if container.StatsCollected {
			project.CPUPercent += container.CPUPercent
			project.MemoryUsageBytes += container.MemoryUsageBytes
		}
	}

	names := make([]string, 0, len(projects))
	for name := range projects {
		names = append(names, name)
	}
	sort.Strings(names)

	result := make([]model.ProjectSnapshot, 0, len(names))
	for _, name := range names {
		result = append(result, *projects[name])
	}
	return result
}

func normalizeContainerName(containerID string, names []string) string {
	if len(names) == 0 {
		if len(containerID) > 12 {
			return containerID[:12]
		}
		return containerID
	}
	return strings.TrimPrefix(names[0], "/")
}

func projectName(labels map[string]string, key string, fallback string) string {
	if labels == nil {
		return fallback
	}
	project := strings.TrimSpace(labels[key])
	if project == "" {
		return fallback
	}
	return project
}

func cpuPercent(stats dockerapi.ContainerStats) float64 {
	cpuDelta := float64(stats.CPUStats.CPUUsage.TotalUsage) - float64(stats.PreCPUStats.CPUUsage.TotalUsage)
	systemDelta := float64(stats.CPUStats.SystemUsage) - float64(stats.PreCPUStats.SystemUsage)
	if cpuDelta <= 0 || systemDelta <= 0 {
		return 0
	}

	cpuCount := float64(stats.CPUStats.OnlineCPUs)
	if cpuCount == 0 {
		cpuCount = float64(len(stats.CPUStats.CPUUsage.PerCPU))
	}
	if cpuCount == 0 {
		cpuCount = 1
	}

	return (cpuDelta / systemDelta) * cpuCount * 100
}

func memoryUsageBytes(stats dockerapi.ContainerMemory) uint64 {
	usage := stats.Usage
	if usage == 0 {
		return 0
	}

	cache := uint64(0)
	switch {
	case stats.Stats["inactive_file"] > 0:
		cache = stats.Stats["inactive_file"]
	case stats.Stats["total_inactive_file"] > 0:
		cache = stats.Stats["total_inactive_file"]
	case stats.Stats["cache"] > 0:
		cache = stats.Stats["cache"]
	}

	if cache >= usage {
		return usage
	}
	return usage - cache
}

func detailedSnapshot(summary dockerapi.ContainerSummary, stats dockerapi.ContainerStats) model.ContainerDetailedSnapshot {
	return model.ContainerDetailedSnapshot{
		StatsRead: stats.Read,
		CPU: model.ContainerCPUSnapshot{
			UsageSecondsTotal:        nanosecondsToSeconds(stats.CPUStats.CPUUsage.TotalUsage),
			UserSecondsTotal:         nanosecondsToSeconds(stats.CPUStats.CPUUsage.UsageInUsermode),
			SystemSecondsTotal:       nanosecondsToSeconds(stats.CPUStats.CPUUsage.UsageInKernelmode),
			CFSPeriodsTotal:          stats.CPUStats.ThrottlingData.Periods,
			CFSThrottledPeriodsTotal: stats.CPUStats.ThrottlingData.ThrottledPeriods,
			CFSThrottledSecondsTotal: nanosecondsToSeconds(stats.CPUStats.ThrottlingData.ThrottledTime),
		},
		Memory: model.ContainerMemoryDetailedSnapshot{
			UsageBytes:      stats.MemoryStats.Usage,
			WorkingSetBytes: memoryUsageBytes(stats.MemoryStats),
			LimitBytes:      stats.MemoryStats.Limit,
			MaxUsageBytes:   stats.MemoryStats.MaxUsage,
			RSSBytes:        firstUint64(stats.MemoryStats.Stats, "rss", "total_rss"),
			CacheBytes:      firstUint64(stats.MemoryStats.Stats, "cache", "total_cache", "inactive_file", "total_inactive_file"),
			SwapBytes:       firstUint64(stats.MemoryStats.Stats, "swap", "total_swap"),
			FailCount:       stats.MemoryStats.Failcnt,
		},
		Network: model.ContainerNetworkDetailedSnapshot{
			Interfaces: networkInterfaces(stats.Networks),
		},
		BlockIO: model.ContainerBlockIOSnapshot{
			ReadBytesTotal:          sumBlkio(stats.BlkioStats.IoServiceBytesRecursive, "read"),
			WriteBytesTotal:         sumBlkio(stats.BlkioStats.IoServiceBytesRecursive, "write"),
			ReadOperationsTotal:     sumBlkio(stats.BlkioStats.IoServicedRecursive, "read"),
			WriteOperationsTotal:    sumBlkio(stats.BlkioStats.IoServicedRecursive, "write"),
			IOTimeSecondsTotal:      blkioValuesToSeconds(stats.BlkioStats.IoTimeRecursive),
			WaitTimeSecondsTotal:    blkioValuesToSeconds(stats.BlkioStats.IoWaitTimeRecursive),
			ServiceTimeSecondsTotal: blkioValuesToSeconds(stats.BlkioStats.IoServiceTimeRecursive),
		},
		Filesystem: model.ContainerFilesystemSnapshot{
			WritableLayerBytes:   clampToUint64(summary.SizeRW),
			WritableLayerPresent: summary.SizeRW >= 0,
			RootFSBytes:          clampToUint64(summary.SizeRootFS),
			RootFSPresent:        summary.SizeRootFS >= 0,
		},
		PIDsCurrent: stats.PIDsStats.Current,
	}
}

func applyInspectDetails(snapshot *model.ContainerDetailedSnapshot, inspect dockerapi.ContainerInspect) {
	snapshot.CPU.QuotaMicroseconds = inspect.HostConfig.CPUQuota
	snapshot.CPU.PeriodMicroseconds = inspect.HostConfig.CPUPeriod
	snapshot.CPU.Shares = inspect.HostConfig.CPUShares
	snapshot.StartedAt = inspect.State.StartedAt
	if inspect.HostConfig.Memory > 0 {
		snapshot.Memory.LimitBytes = uint64(inspect.HostConfig.Memory)
	}
	if inspect.HostConfig.MemorySwap > 0 {
		snapshot.Memory.SwapLimitBytes = uint64(inspect.HostConfig.MemorySwap)
	}
	snapshot.OOMKilled = inspect.State.OOMKilled
	if inspect.State.Health != nil {
		snapshot.HealthStatus = inspect.State.Health.Status
	}
	snapshot.InspectFound = true
}

func networkInterfaces(networks map[string]dockerapi.ContainerNetwork) []model.ContainerNetworkInterfaceSnapshot {
	if len(networks) == 0 {
		return nil
	}

	names := make([]string, 0, len(networks))
	for name := range networks {
		names = append(names, name)
	}
	sort.Strings(names)

	result := make([]model.ContainerNetworkInterfaceSnapshot, 0, len(names))
	for _, name := range names {
		network := networks[name]
		result = append(result, model.ContainerNetworkInterfaceSnapshot{
			Name:           name,
			RxBytesTotal:   network.RxBytes,
			TxBytesTotal:   network.TxBytes,
			RxPacketsTotal: network.RxPackets,
			TxPacketsTotal: network.TxPackets,
			RxErrorsTotal:  network.RxErrors,
			TxErrorsTotal:  network.TxErrors,
			RxDroppedTotal: network.RxDropped,
			TxDroppedTotal: network.TxDropped,
		})
	}
	return result
}

func sumBlkio(entries []dockerapi.ContainerBlkioStatEntry, op string) uint64 {
	var total uint64
	for _, entry := range entries {
		if strings.EqualFold(strings.TrimSpace(entry.Op), op) {
			total += entry.Value
		}
	}
	return total
}

func blkioValuesToSeconds(entries []dockerapi.ContainerBlkioStatEntry) float64 {
	var total uint64
	for _, entry := range entries {
		total += entry.Value
	}
	return nanosecondsToSeconds(total)
}

func firstUint64(values map[string]uint64, keys ...string) uint64 {
	for _, key := range keys {
		if value, ok := values[key]; ok {
			return value
		}
	}
	return 0
}

func clampToUint64(value int64) uint64 {
	if value <= 0 {
		return 0
	}
	return uint64(value)
}

func nanosecondsToSeconds(value uint64) float64 {
	return float64(value) / float64(time.Second)
}

func cloneOOMEvents(values map[string]uint64) map[string]uint64 {
	if len(values) == 0 {
		return nil
	}

	result := make(map[string]uint64, len(values))
	for key, value := range values {
		result[key] = value
	}
	return result
}
