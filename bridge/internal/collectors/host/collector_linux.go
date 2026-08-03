//go:build linux

package hostcollector

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/prometheus/procfs"
	"github.com/prometheus/procfs/blockdevice"
	"golang.org/x/sys/unix"

	"github.com/RCooLeR/UgosBridge/bridge/internal/model"
)

type FilesystemMount struct {
	Name          string
	ContainerPath string
}

type Config struct {
	ProcFS                   string
	SysFS                    string
	HostnamePath             string
	HostnameOverride         string
	Filesystems              []FilesystemMount
	NetworkInclude           []string
	DRIPath                  string
	TemperatureAverageWindow time.Duration
	UPSEnabled               bool
	UPSCommand               string
	UPSTargets               []string
	UPSTimeout               time.Duration
	IntelGPUTopEnabled       bool
	IntelGPUTopPath          string
	IntelGPUTopDevice        string
	IntelGPUTopPeriod        time.Duration
	VMsEnabled               bool
	VirshPath                string
	VirshURI                 string
	VirshTimeout             time.Duration
	VMNameOverrides          map[string]string
}

type Collector struct {
	cfg                Config
	proc               procfs.FS
	block              blockdevice.FS
	networkInclude     []*regexp.Regexp
	mu                 sync.Mutex
	lastAt             time.Time
	lastCPU            cpuSnapshot
	lastNet            map[string]procfs.NetDevLine
	lastDisk           map[string]diskSample
	lastProc           map[int]processSample
	lastVM             map[string]vmSample
	temperatureSamples map[string][]temperatureSample
}

type cpuSnapshot struct {
	total procfs.CPUStat
	cores map[int64]procfs.CPUStat
}

type diskSample struct {
	readBytes  uint64
	writeBytes uint64
	readIOs    uint64
	writeIOs   uint64
	ioMillis   uint64
}

type temperatureSample struct {
	at    time.Time
	value float64
}

type mountEntry struct {
	source     string
	mountpoint string
	fsType     string
	readOnly   bool
}

type intelGPUTopSample struct {
	Engines map[string]struct {
		Busy float64 `json:"busy"`
		Sema float64 `json:"sema"`
		Wait float64 `json:"wait"`
	} `json:"engines"`
	Frequency struct {
		Actual    float64 `json:"actual"`
		Requested float64 `json:"requested"`
	} `json:"frequency"`
	IMCBandwidth struct {
		Reads  float64 `json:"reads"`
		Writes float64 `json:"writes"`
	} `json:"imc-bandwidth"`
	Interrupts struct {
		Count float64 `json:"count"`
	} `json:"interrupts"`
	Period struct {
		Duration float64 `json:"duration"`
	} `json:"period"`
	Power struct {
		GPU     float64 `json:"GPU"`
		Package float64 `json:"Package"`
	} `json:"power"`
	RC6 struct {
		Value float64 `json:"value"`
	} `json:"rc6"`
}

var (
	defaultNetworkIncludePatterns = []string{`^eth.*$`, `^bond.*$`}
	poolMapperPattern             = regexp.MustCompile(`(?:^|_)(pool\d+)(?:-|$)`)
	nvmeControllerPat             = regexp.MustCompile(`^nvme\d+$`)
	nvmeDiskPattern               = regexp.MustCompile(`^nvme\d+n\d+$`)
	mmcDiskPattern                = regexp.MustCompile(`^mmcblk\d+$`)
)

func New(cfg Config) (*Collector, error) {
	if strings.TrimSpace(cfg.ProcFS) == "" {
		cfg.ProcFS = "/host/proc"
	}
	if strings.TrimSpace(cfg.SysFS) == "" {
		cfg.SysFS = "/host/sys"
	}
	if strings.TrimSpace(cfg.HostnamePath) == "" {
		cfg.HostnamePath = "/rootfs/etc/hostname"
	}
	if strings.TrimSpace(cfg.IntelGPUTopPath) == "" {
		cfg.IntelGPUTopPath = "intel_gpu_top"
	}
	if cfg.IntelGPUTopPeriod <= 0 {
		cfg.IntelGPUTopPeriod = time.Second
	}
	if strings.TrimSpace(cfg.UPSCommand) == "" {
		cfg.UPSCommand = "upsc"
	}
	if cfg.UPSTimeout <= 0 {
		cfg.UPSTimeout = 3 * time.Second
	}
	if strings.TrimSpace(cfg.VirshPath) == "" {
		cfg.VirshPath = "virsh"
	}
	if strings.TrimSpace(cfg.VirshURI) == "" {
		cfg.VirshURI = "qemu:///system"
	}
	if cfg.VirshTimeout <= 0 {
		cfg.VirshTimeout = 3 * time.Second
	}
	proc, err := procfs.NewFS(cfg.ProcFS)
	if err != nil {
		return nil, fmt.Errorf("open procfs %q: %w", cfg.ProcFS, err)
	}
	blockFS, err := blockdevice.NewFS(cfg.ProcFS, cfg.SysFS)
	if err != nil {
		return nil, fmt.Errorf("open blockdevice fs: %w", err)
	}
	networkInclude, err := compileRegexList(cfg.NetworkInclude, defaultNetworkIncludePatterns)
	if err != nil {
		return nil, fmt.Errorf("compile network include rules: %w", err)
	}

	return &Collector{
		cfg:                cfg,
		proc:               proc,
		block:              blockFS,
		networkInclude:     networkInclude,
		lastNet:            map[string]procfs.NetDevLine{},
		lastDisk:           map[string]diskSample{},
		lastProc:           map[int]processSample{},
		lastVM:             map[string]vmSample{},
		temperatureSamples: map[string][]temperatureSample{},
	}, nil
}

func (c *Collector) Collect(ctx context.Context) (model.HostSnapshot, error) {
	now := time.Now()

	stat, err := c.proc.Stat()
	if err != nil {
		return model.HostSnapshot{}, fmt.Errorf("read /proc/stat: %w", err)
	}
	load, err := c.proc.LoadAvg()
	if err != nil {
		return model.HostSnapshot{}, fmt.Errorf("read /proc/loadavg: %w", err)
	}
	meminfo, err := c.proc.Meminfo()
	if err != nil {
		return model.HostSnapshot{}, fmt.Errorf("read /proc/meminfo: %w", err)
	}
	netdev, err := c.readNetDev()
	if err != nil {
		return model.HostSnapshot{}, fmt.Errorf("read /proc/net/dev: %w", err)
	}
	mdstat, err := c.proc.MDStat()
	if err != nil {
		return model.HostSnapshot{}, fmt.Errorf("read /proc/mdstat: %w", err)
	}
	diskstats, err := c.block.ProcDiskstats()
	if err != nil {
		return model.HostSnapshot{}, fmt.Errorf("read /proc/diskstats: %w", err)
	}

	mounts, err := c.readHostMounts()
	if err != nil {
		return model.HostSnapshot{}, fmt.Errorf("read host mounts: %w", err)
	}

	hostname, err := c.resolveHostname()
	if err != nil {
		return model.HostSnapshot{}, err
	}

	snapshot := model.HostSnapshot{
		Name: hostname,
		CPU: model.HostCPUSnapshot{
			Cores:            len(stat.CPU),
			Load1:            load.Load1,
			Load5:            load.Load5,
			Load15:           load.Load15,
			UptimeSeconds:    float64(now.Unix()) - float64(stat.BootTime),
			ContextSwitches:  stat.ContextSwitches,
			ProcessesRunning: stat.ProcessesRunning,
			ProcessesBlocked: stat.ProcessesBlocked,
		},
		Memory: collectMemory(meminfo),
	}

	c.mu.Lock()
	elapsed := now.Sub(c.lastAt).Seconds()
	snapshot.CPU.UsagePercent = cpuUsagePercent(c.lastCPU.total, stat.CPUTotal)
	cores := make([]model.CPUCoreSnapshot, 0, len(stat.CPU))
	var totalCurrentMHz float64
	var coresWithFrequency int
	for idx, current := range stat.CPU {
		core := model.CPUCoreSnapshot{
			Name:         fmt.Sprintf("cpu%d", idx),
			UsagePercent: cpuUsagePercent(c.lastCPU.cores[idx], current),
		}
		core.CurrentMHz, core.MinMHz, core.MaxMHz, core.Governor = c.collectCPUFrequency(idx)
		if core.CurrentMHz > 0 {
			totalCurrentMHz += core.CurrentMHz
			coresWithFrequency++
		}
		cores = append(cores, core)
	}
	sort.Slice(cores, func(i, j int) bool { return cores[i].Name < cores[j].Name })
	snapshot.CPU.CoreUsage = cores
	if coresWithFrequency > 0 {
		snapshot.CPU.CurrentMHz = totalCurrentMHz / float64(coresWithFrequency)
	}
	c.lastCPU = cpuSnapshot{total: stat.CPUTotal, cores: cloneCPUMap(stat.CPU)}
	snapshot.Networks = c.collectNetworksLocked(now, netdev)
	snapshot.Disks = c.collectDisksLocked(now, diskstats)
	snapshot.Processes = c.collectProcessesLocked(elapsed)
	snapshot.VMs = c.collectVirtualMachinesLocked(ctx, elapsed)
	c.lastAt = now
	c.mu.Unlock()

	snapshot.Filesystems = c.collectFilesystems(mounts)
	snapshot.Arrays = c.collectArrays(mdstat, mounts)
	snapshot.Bonds = c.collectBonds()
	snapshot.GPUs = c.collectGPUs()
	snapshot.Sensors = c.collectSensors()
	c.smoothTemperatureSensors(now, snapshot.Sensors)
	snapshot.Cooling = c.collectCoolingDevices()
	snapshot.UPSs = c.collectUPSs(ctx)

	return snapshot, nil
}

func cloneCPUMap(src map[int64]procfs.CPUStat) map[int64]procfs.CPUStat {
	dst := make(map[int64]procfs.CPUStat, len(src))
	for key, value := range src {
		dst[key] = value
	}
	return dst
}

func collectMemory(meminfo procfs.Meminfo) model.HostMemorySnapshot {
	total := valueOrZero(meminfo.MemTotalBytes)
	free := valueOrZero(meminfo.MemFreeBytes)
	available := valueOrZero(meminfo.MemAvailableBytes)
	cached := valueOrZero(meminfo.CachedBytes)
	buffers := valueOrZero(meminfo.BuffersBytes)
	used := total
	if available <= total {
		used = total - available
	}
	swapTotal := valueOrZero(meminfo.SwapTotalBytes)
	swapFree := valueOrZero(meminfo.SwapFreeBytes)
	swapUsed := uint64(0)
	if swapFree <= swapTotal {
		swapUsed = swapTotal - swapFree
	}

	return model.HostMemorySnapshot{
		TotalBytes:     total,
		UsedBytes:      used,
		FreeBytes:      free,
		AvailableBytes: available,
		CachedBytes:    cached,
		BuffersBytes:   buffers,
		SwapTotalBytes: swapTotal,
		SwapUsedBytes:  swapUsed,
		SwapFreeBytes:  swapFree,
	}
}

func (c *Collector) collectFilesystems(mounts map[string]mountEntry) []model.FilesystemSnapshot {
	result := make([]model.FilesystemSnapshot, 0, len(c.cfg.Filesystems))
	for _, fs := range c.cfg.Filesystems {
		var stat unix.Statfs_t
		if err := unix.Statfs(fs.ContainerPath, &stat); err != nil {
			continue
		}

		entry := mounts[fs.Name]
		if fs.Name == "/" && isOverlayFilesystem(entry) {
			continue
		}
		total := stat.Blocks * uint64(stat.Bsize)
		free := stat.Bfree * uint64(stat.Bsize)
		available := stat.Bavail * uint64(stat.Bsize)
		used := total
		if free <= total {
			used = total - free
		}
		filesTotal := stat.Files
		filesFree := stat.Ffree
		filesUsed := filesTotal
		if filesFree <= filesTotal {
			filesUsed = filesTotal - filesFree
		}

		result = append(result, model.FilesystemSnapshot{
			Name:           fs.Name,
			Path:           fs.ContainerPath,
			Source:         entry.source,
			FSType:         entry.fsType,
			Array:          c.arrayNameFromSource(entry.source),
			TotalBytes:     total,
			UsedBytes:      used,
			FreeBytes:      free,
			AvailableBytes: available,
			FilesTotal:     filesTotal,
			FilesFree:      filesFree,
			FilesUsed:      filesUsed,
			ReadOnly:       entry.readOnly,
		})
	}

	sort.Slice(result, func(i, j int) bool { return result[i].Name < result[j].Name })
	return result
}

func (c *Collector) attachIntelGPUTopMetrics(gpus []model.GPUSnapshot) {
	if !c.cfg.IntelGPUTopEnabled || len(gpus) == 0 {
		return
	}

	sample, err := c.collectIntelGPUTopSample()
	if err != nil {
		return
	}

	targetIndex := c.resolveIntelGPUTargetIndex(gpus)
	if targetIndex < 0 || targetIndex >= len(gpus) {
		return
	}

	gpus[targetIndex].IntelTop = &model.IntelGPUSnapshot{
		ActualMHz:          sample.Frequency.Actual,
		RequestedMHz:       sample.Frequency.Requested,
		IMCReadsMiBPerSec:  sample.IMCBandwidth.Reads,
		IMCWritesMiBPerSec: sample.IMCBandwidth.Writes,
		InterruptsPerSec:   sample.Interrupts.Count,
		PeriodMilliseconds: sample.Period.Duration,
		GPUPowerWatts:      sample.Power.GPU,
		PackagePowerWatts:  sample.Power.Package,
		RC6Percent:         sample.RC6.Value,
		Engines:            make([]model.GPUEngineSnapshot, 0, len(sample.Engines)),
	}
	if gpus[targetIndex].CurrentMHz == 0 && sample.Frequency.Actual > 0 {
		gpus[targetIndex].CurrentMHz = uint64(sample.Frequency.Actual)
	}

	engineNames := make([]string, 0, len(sample.Engines))
	for name := range sample.Engines {
		engineNames = append(engineNames, name)
	}
	sort.Strings(engineNames)
	for _, name := range engineNames {
		engine := sample.Engines[name]
		gpus[targetIndex].IntelTop.Engines = append(gpus[targetIndex].IntelTop.Engines, model.GPUEngineSnapshot{
			Name:        name,
			BusyPercent: engine.Busy,
			SemaPercent: engine.Sema,
			WaitPercent: engine.Wait,
		})
	}

	if busyPercent, ok := maxGPUEngineBusyPercent(gpus[targetIndex].IntelTop.Engines); ok {
		gpus[targetIndex].BusyPercent = busyPercent
		gpus[targetIndex].BusyAvailable = true
	}
}

func (c *Collector) collectIntelGPUTopSample() (intelGPUTopSample, error) {
	ctx, cancel := context.WithTimeout(context.Background(), c.cfg.IntelGPUTopPeriod+2*time.Second)
	defer cancel()

	args := []string{"-J", "-s", strconv.Itoa(int(c.cfg.IntelGPUTopPeriod.Milliseconds()))}
	if device := strings.TrimSpace(c.cfg.IntelGPUTopDevice); device != "" {
		args = append(args, "-d", device)
	}

	cmd := exec.CommandContext(ctx, c.cfg.IntelGPUTopPath, args...)
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return intelGPUTopSample{}, err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return intelGPUTopSample{}, err
	}
	if err := cmd.Start(); err != nil {
		return intelGPUTopSample{}, err
	}
	defer func() {
		_ = cmd.Process.Kill()
		_ = cmd.Wait()
	}()

	scanner := bufio.NewScanner(stdout)
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	var output strings.Builder
	for scanner.Scan() {
		output.WriteString(scanner.Text())
		trimmed := strings.TrimSuffix(strings.TrimSpace(output.String()), ",")
		var sample intelGPUTopSample
		if err := json.Unmarshal([]byte(trimmed), &sample); err == nil {
			return sample, nil
		}
	}
	if err := scanner.Err(); err != nil {
		return intelGPUTopSample{}, err
	}

	rawErr, _ := io.ReadAll(stderr)
	if len(rawErr) > 0 {
		return intelGPUTopSample{}, fmt.Errorf("%s", strings.TrimSpace(string(rawErr)))
	}
	return intelGPUTopSample{}, fmt.Errorf("no intel_gpu_top sample received")
}

func (c *Collector) resolveIntelGPUTargetIndex(gpus []model.GPUSnapshot) int {
	if cardName := c.cardNameFromIntelGPUTopDevice(); cardName != "" {
		for idx, gpu := range gpus {
			if gpu.Name == cardName {
				return idx
			}
		}
	}
	for idx, gpu := range gpus {
		if gpu.Driver == "i915" {
			return idx
		}
	}
	if len(gpus) == 1 {
		return 0
	}
	return -1
}

func (c *Collector) cardNameFromIntelGPUTopDevice() string {
	device := strings.TrimSpace(c.cfg.IntelGPUTopDevice)
	if device == "" {
		return ""
	}
	device = strings.TrimPrefix(device, "drm:")
	base := filepath.Base(device)
	if !strings.HasPrefix(base, "renderD") && !strings.HasPrefix(base, "card") {
		return ""
	}
	matches, err := filepath.Glob(filepath.Join(c.cfg.SysFS, "class", "drm", base, "device", "drm", "card*"))
	if err == nil && len(matches) > 0 {
		return filepath.Base(matches[0])
	}
	if strings.HasPrefix(base, "card") {
		return base
	}
	return ""
}

func (c *Collector) collectCPUFrequency(index int64) (currentMHz float64, minMHz float64, maxMHz float64, governor string) {
	base := filepath.Join(c.cfg.SysFS, "devices", "system", "cpu", fmt.Sprintf("cpu%d", index), "cpufreq")
	currentKHz, currentOK := readFirstUint(
		filepath.Join(base, "scaling_cur_freq"),
		filepath.Join(base, "cpuinfo_cur_freq"),
	)
	minKHz, _ := readFirstUint(
		filepath.Join(base, "scaling_min_freq"),
		filepath.Join(base, "cpuinfo_min_freq"),
	)
	maxKHz, _ := readFirstUint(
		filepath.Join(base, "scaling_max_freq"),
		filepath.Join(base, "cpuinfo_max_freq"),
	)

	governor = strings.TrimSpace(readTextFile(filepath.Join(base, "scaling_governor")))
	if currentOK {
		currentMHz = float64(currentKHz) / 1000
	}
	if minKHz > 0 {
		minMHz = float64(minKHz) / 1000
	}
	if maxKHz > 0 {
		maxMHz = float64(maxKHz) / 1000
	}
	return currentMHz, minMHz, maxMHz, governor
}

func (c *Collector) collectArrays(mdstats []procfs.MDStat, mounts map[string]mountEntry) []model.ArraySnapshot {
	result := make([]model.ArraySnapshot, 0, len(mdstats))
	for _, md := range mdstats {
		sizeBytes, _ := readUintFile(filepath.Join(c.cfg.SysFS, "block", md.Name, "size"))
		sizeBytes *= 512
		degraded, _ := readUintFile(filepath.Join(c.cfg.SysFS, "block", md.Name, "md", "degraded"))
		level := strings.TrimSpace(readTextFile(filepath.Join(c.cfg.SysFS, "block", md.Name, "md", "level")))
		state := strings.TrimSpace(readTextFile(filepath.Join(c.cfg.SysFS, "block", md.Name, "md", "array_state")))
		syncAction := strings.TrimSpace(readTextFile(filepath.Join(c.cfg.SysFS, "block", md.Name, "md", "sync_action")))
		if level == "" {
			level = md.ActivityState
		}
		mountpoints := mountpointsForDevice(mounts, md.Name)

		result = append(result, model.ArraySnapshot{
			Name:                 md.Name,
			Level:                level,
			State:                firstNonEmpty(state, md.ActivityState),
			SizeBytes:            sizeBytes,
			DisksTotal:           uint64(md.DisksTotal),
			DisksActive:          uint64(md.DisksActive),
			DisksFailed:          uint64(md.DisksFailed),
			DisksSpare:           uint64(md.DisksSpare),
			DegradedDisks:        degraded,
			SyncAction:           syncAction,
			SyncCompletedPercent: md.BlocksSyncedPct,
			Members:              append([]string(nil), md.Devices...),
			Mountpoints:          mountpoints,
		})
	}

	sort.Slice(result, func(i, j int) bool { return result[i].Name < result[j].Name })
	return result
}

func (c *Collector) readNetDev() (procfs.NetDev, error) {
	if trimmed := strings.TrimSpace(c.cfg.ProcFS); trimmed != "" {
		hostInitFS, err := procfs.NewFS(filepath.Join(trimmed, "1"))
		if err == nil {
			netdev, netErr := hostInitFS.NetDev()
			if netErr == nil && len(netdev) > 0 {
				return netdev, nil
			}
		}
	}

	return c.proc.NetDev()
}

func (c *Collector) collectNetworksLocked(now time.Time, netdev procfs.NetDev) []model.NetworkSnapshot {
	result := make([]model.NetworkSnapshot, 0, len(netdev))
	elapsed := now.Sub(c.lastAt).Seconds()
	for name, stats := range netdev {
		if name == "lo" {
			continue
		}
		if !matchesRegex(name, c.networkInclude) {
			delete(c.lastNet, name)
			continue
		}

		sysBase := filepath.Join(c.cfg.SysFS, "class", "net", name)
		speed, _ := readIntFile(filepath.Join(sysBase, "speed"))
		mtu, _ := readIntFile(filepath.Join(sysBase, "mtu"))
		carrier, _ := readIntFile(filepath.Join(sysBase, "carrier"))

		entry := model.NetworkSnapshot{
			Name:           name,
			Master:         c.networkMaster(name),
			MAC:            strings.TrimSpace(readTextFile(filepath.Join(sysBase, "address"))),
			OperState:      strings.TrimSpace(readTextFile(filepath.Join(sysBase, "operstate"))),
			Duplex:         strings.TrimSpace(readTextFile(filepath.Join(sysBase, "duplex"))),
			SpeedMbps:      speed,
			MTU:            mtu,
			Carrier:        carrier == 1,
			RxBytesTotal:   stats.RxBytes,
			TxBytesTotal:   stats.TxBytes,
			RxPacketsTotal: stats.RxPackets,
			TxPacketsTotal: stats.TxPackets,
			RxErrorsTotal:  stats.RxErrors,
			TxErrorsTotal:  stats.TxErrors,
			RxDroppedTotal: stats.RxDropped,
			TxDroppedTotal: stats.TxDropped,
		}

		if prev, ok := c.lastNet[name]; ok && elapsed > 0 {
			entry.RxBytesPerSec = rateUint64(stats.RxBytes, prev.RxBytes, elapsed)
			entry.TxBytesPerSec = rateUint64(stats.TxBytes, prev.TxBytes, elapsed)
		}

		c.lastNet[name] = stats
		result = append(result, entry)
	}

	sort.Slice(result, func(i, j int) bool { return result[i].Name < result[j].Name })
	return result
}

func (c *Collector) collectBonds() []model.BondSnapshot {
	matches, err := filepath.Glob(filepath.Join(c.cfg.SysFS, "class", "net", "*", "bonding"))
	if err != nil {
		return nil
	}

	result := make([]model.BondSnapshot, 0, len(matches))
	for _, bondingPath := range matches {
		bondName := filepath.Base(filepath.Dir(bondingPath))
		if !matchesRegex(bondName, c.networkInclude) {
			continue
		}
		sysBase := filepath.Join(c.cfg.SysFS, "class", "net", bondName)
		activeSlave := strings.TrimSpace(readTextFile(filepath.Join(bondingPath, "active_slave")))
		slaveNames := strings.Fields(readTextFile(filepath.Join(bondingPath, "slaves")))

		bond := model.BondSnapshot{
			Name:        bondName,
			Mode:        firstField(strings.TrimSpace(readTextFile(filepath.Join(bondingPath, "mode")))),
			ActiveSlave: activeSlave,
			Primary:     strings.TrimSpace(readTextFile(filepath.Join(bondingPath, "primary"))),
			MIIStatus:   strings.TrimSpace(readTextFile(filepath.Join(bondingPath, "mii_status"))),
			OperState:   strings.TrimSpace(readTextFile(filepath.Join(sysBase, "operstate"))),
			SpeedMbps:   readIntFileOrZero(filepath.Join(sysBase, "speed")),
			Carrier:     readIntFileOrZero(filepath.Join(sysBase, "carrier")) == 1,
			Slaves:      make([]model.BondSlaveSnapshot, 0, len(slaveNames)),
		}

		for _, slaveName := range slaveNames {
			slaveBase := filepath.Join(c.cfg.SysFS, "class", "net", slaveName)
			bond.Slaves = append(bond.Slaves, model.BondSlaveSnapshot{
				Name:      slaveName,
				MIIStatus: strings.TrimSpace(readTextFile(filepath.Join(slaveBase, "bonding_slave", "mii_status"))),
				OperState: strings.TrimSpace(readTextFile(filepath.Join(slaveBase, "operstate"))),
				Duplex:    strings.TrimSpace(readTextFile(filepath.Join(slaveBase, "duplex"))),
				SpeedMbps: readIntFileOrZero(filepath.Join(slaveBase, "speed")),
				Carrier:   readIntFileOrZero(filepath.Join(slaveBase, "carrier")) == 1,
				Active:    slaveName == activeSlave,
			})
		}
		sort.Slice(bond.Slaves, func(i, j int) bool { return bond.Slaves[i].Name < bond.Slaves[j].Name })
		result = append(result, bond)
	}

	sort.Slice(result, func(i, j int) bool { return result[i].Name < result[j].Name })
	return result
}

func (c *Collector) collectDisksLocked(now time.Time, diskstats []blockdevice.Diskstats) []model.DiskSnapshot {
	result := make([]model.DiskSnapshot, 0, len(diskstats))
	elapsed := now.Sub(c.lastAt).Seconds()
	for _, stats := range diskstats {
		if !isPhysicalDisk(stats.DeviceName) {
			continue
		}

		sysBase := filepath.Join(c.cfg.SysFS, "block", stats.DeviceName)
		rotational, _ := readUintFile(filepath.Join(sysBase, "queue", "rotational"))
		sizeBytes, _ := readUintFile(filepath.Join(sysBase, "size"))
		sizeBytes *= 512
		serial := strings.TrimSpace(readTextFile(filepath.Join(sysBase, "device", "serial")))
		devicePath := stableDiskPath(sysBase, c.cfg.SysFS)

		entry := model.DiskSnapshot{
			Name:            stats.DeviceName,
			Path:            devicePath,
			Model:           strings.TrimSpace(readTextFile(filepath.Join(sysBase, "device", "model"))),
			Vendor:          strings.TrimSpace(readTextFile(filepath.Join(sysBase, "device", "vendor"))),
			Serial:          serial,
			Type:            diskType(stats.DeviceName, rotational == 1),
			SizeBytes:       sizeBytes,
			Rotational:      rotational == 1,
			ReadBytesTotal:  stats.ReadSectors * 512,
			WriteBytesTotal: stats.WriteSectors * 512,
			ReadIOsTotal:    stats.ReadIOs,
			WriteIOsTotal:   stats.WriteIOs,
		}

		identity := "name:" + stats.DeviceName
		if devicePath != "" {
			identity = "path:" + devicePath
		}
		if serial != "" {
			identity = "serial:" + serial
		}
		if prev, ok := c.lastDisk[identity]; ok && elapsed > 0 {
			entry.ReadBytesPerSec = rateUint64(entry.ReadBytesTotal, prev.readBytes, elapsed)
			entry.WriteBytesPerSec = rateUint64(entry.WriteBytesTotal, prev.writeBytes, elapsed)
			entry.ReadIOPS = rateUint64(entry.ReadIOsTotal, prev.readIOs, elapsed)
			entry.WriteIOPS = rateUint64(entry.WriteIOsTotal, prev.writeIOs, elapsed)
			entry.BusyPercent = percentUint64(stats.IOsTotalTicks, prev.ioMillis, elapsed*1000)
		}

		c.lastDisk[identity] = diskSample{
			readBytes:  entry.ReadBytesTotal,
			writeBytes: entry.WriteBytesTotal,
			readIOs:    entry.ReadIOsTotal,
			writeIOs:   entry.WriteIOsTotal,
			ioMillis:   stats.IOsTotalTicks,
		}
		result = append(result, entry)
	}

	sort.Slice(result, func(i, j int) bool { return result[i].Name < result[j].Name })
	return result
}

func stableDiskPath(sysBase string, sysFS string) string {
	target, err := filepath.EvalSymlinks(filepath.Join(sysBase, "device"))
	if err != nil {
		target, err = filepath.EvalSymlinks(sysBase)
	}
	if err != nil {
		return ""
	}

	if relative, relErr := filepath.Rel(filepath.Clean(sysFS), target); relErr == nil && relative != "." && !strings.HasPrefix(relative, "..") {
		return normalizeDiskIdentityPath("/"+filepath.ToSlash(relative), sysBase)
	}
	return normalizeDiskIdentityPath(filepath.ToSlash(target), sysBase)
}

func normalizeDiskIdentityPath(path string, sysBase string) string {
	parts := strings.Split(path, "/")
	normalized := make([]string, 0, len(parts))
	for _, part := range parts {
		if isNVMeController(part) {
			continue
		}
		if strings.HasPrefix(part, "nvme") && isPhysicalDisk(part) {
			namespaceID := strings.TrimSpace(readTextFile(filepath.Join(sysBase, "nsid")))
			if _, err := strconv.ParseUint(namespaceID, 10, 64); err != nil {
				namespaceID = "unknown"
			}
			part = "namespace_" + namespaceID
		}
		normalized = append(normalized, part)
	}
	return strings.Join(normalized, "/")
}

func (c *Collector) networkMaster(name string) string {
	target, err := filepath.EvalSymlinks(filepath.Join(c.cfg.SysFS, "class", "net", name, "master"))
	if err != nil {
		return ""
	}
	return filepath.Base(target)
}

func (c *Collector) collectGPUs() []model.GPUSnapshot {
	if strings.TrimSpace(c.cfg.DRIPath) != "" {
		if _, err := os.Stat(c.cfg.DRIPath); err != nil {
			return nil
		}
	}

	matches, err := filepath.Glob(filepath.Join(c.cfg.SysFS, "class", "drm", "card[0-9]"))
	if err != nil {
		return nil
	}

	result := make([]model.GPUSnapshot, 0, len(matches))
	for _, card := range matches {
		driver := parseUEventValue(readTextFile(filepath.Join(card, "device", "uevent")), "DRIVER")
		if driver == "" {
			continue
		}

		busy, busyOK := readFirstUint(
			filepath.Join(card, "device", "gpu_busy_percent"),
			filepath.Join(card, "gt", "gt0", "busy_percent"),
		)
		currentMHz, _ := readFirstUint(
			filepath.Join(card, "gt_cur_freq_mhz"),
			filepath.Join(card, "device", "gt_cur_freq_mhz"),
			filepath.Join(card, "device", "gt_act_freq_mhz"),
			filepath.Join(card, "gt", "gt0", "rps_cur_freq_mhz"),
		)
		maxMHz, _ := readFirstUint(
			filepath.Join(card, "gt_max_freq_mhz"),
			filepath.Join(card, "device", "gt_max_freq_mhz"),
			filepath.Join(card, "gt", "gt0", "rps_max_freq_mhz"),
		)
		boostMHz, _ := readFirstUint(
			filepath.Join(card, "gt_boost_freq_mhz"),
			filepath.Join(card, "device", "gt_boost_freq_mhz"),
			filepath.Join(card, "gt", "gt0", "rps_boost_freq_mhz"),
		)

		result = append(result, model.GPUSnapshot{
			Name:          filepath.Base(card),
			Driver:        driver,
			Vendor:        strings.TrimSpace(readTextFile(filepath.Join(card, "device", "vendor"))),
			Device:        strings.TrimSpace(readTextFile(filepath.Join(card, "device", "device"))),
			CardPath:      card,
			BusyPercent:   float64(busy),
			BusyAvailable: busyOK,
			CurrentMHz:    currentMHz,
			MaxMHz:        maxMHz,
			BoostMHz:      boostMHz,
		})
	}

	sort.Slice(result, func(i, j int) bool { return result[i].Name < result[j].Name })
	c.attachIntelGPUTopMetrics(result)
	return result
}

func (c *Collector) collectSensors() []model.SensorSnapshot {
	var result []model.SensorSnapshot
	result = append(result, c.collectHwmonSensors()...)
	result = append(result, c.collectThermalZoneSensors()...)

	sort.Slice(result, func(i, j int) bool {
		if result[i].Chip == result[j].Chip {
			if result[i].Kind == result[j].Kind {
				return result[i].Name < result[j].Name
			}
			return result[i].Kind < result[j].Kind
		}
		return result[i].Chip < result[j].Chip
	})

	return result
}

func (c *Collector) smoothTemperatureSensors(now time.Time, sensors []model.SensorSnapshot) {
	window := c.cfg.TemperatureAverageWindow
	if window <= 0 {
		return
	}

	c.mu.Lock()
	defer c.mu.Unlock()

	if c.temperatureSamples == nil {
		c.temperatureSamples = map[string][]temperatureSample{}
	}

	seen := map[string]struct{}{}
	cutoff := now.Add(-window)
	for idx := range sensors {
		if sensors[idx].Kind != "temperature" {
			continue
		}

		key := temperatureSensorKey(sensors[idx])
		seen[key] = struct{}{}
		samples := append(c.temperatureSamples[key], temperatureSample{at: now, value: sensors[idx].Value})
		keepFrom := 0
		for keepFrom < len(samples) && samples[keepFrom].at.Before(cutoff) {
			keepFrom++
		}
		samples = samples[keepFrom:]
		c.temperatureSamples[key] = samples

		var total float64
		for _, sample := range samples {
			total += sample.value
		}
		if len(samples) > 0 {
			sensors[idx].Value = total / float64(len(samples))
		}
	}

	for key := range c.temperatureSamples {
		if _, ok := seen[key]; !ok {
			delete(c.temperatureSamples, key)
		}
	}
}

func temperatureSensorKey(sensor model.SensorSnapshot) string {
	return strings.Join([]string{
		sensor.Source,
		sensor.Chip,
		sensor.Name,
		sensor.Label,
		sensor.DeviceType,
		sensor.DeviceName,
	}, "\x00")
}

func (c *Collector) collectCoolingDevices() []model.CoolingDeviceSnapshot {
	matches, err := filepath.Glob(filepath.Join(c.cfg.SysFS, "class", "thermal", "cooling_device*"))
	if err != nil {
		return nil
	}

	result := make([]model.CoolingDeviceSnapshot, 0, len(matches))
	for _, coolingPath := range matches {
		curState, err := readIntFile(filepath.Join(coolingPath, "cur_state"))
		if err != nil {
			continue
		}
		maxState, _ := readIntFile(filepath.Join(coolingPath, "max_state"))
		deviceType := strings.TrimSpace(readTextFile(filepath.Join(coolingPath, "type")))
		if deviceType == "" {
			deviceType = filepath.Base(coolingPath)
		}

		entry := model.CoolingDeviceSnapshot{
			Name:     filepath.Base(coolingPath),
			Type:     deviceType,
			CurState: curState,
			MaxState: maxState,
		}
		if maxState > 0 && curState >= 0 {
			entry.Percent = clampPercent((float64(curState) / float64(maxState)) * 100)
		}
		result = append(result, entry)
	}

	sort.Slice(result, func(i, j int) bool { return result[i].Name < result[j].Name })
	return result
}

func (c *Collector) collectUPSs(ctx context.Context) []model.UPSSnapshot {
	if !c.cfg.UPSEnabled {
		return nil
	}

	targets := c.cfg.UPSTargets
	if len(targets) == 0 {
		targets = c.listUPSTargets(ctx)
	}
	if len(targets) == 0 {
		return nil
	}

	result := make([]model.UPSSnapshot, 0, len(targets))
	for _, target := range targets {
		values, err := c.readUPSTarget(ctx, target)
		if err != nil {
			continue
		}
		result = append(result, buildUPSSnapshot(target, values))
	}

	sort.Slice(result, func(i, j int) bool { return result[i].Name < result[j].Name })
	return result
}

func (c *Collector) listUPSTargets(ctx context.Context) []string {
	output, err := c.runUPSCommand(ctx, "-l")
	if err != nil {
		return nil
	}

	targets := make([]string, 0)
	for _, line := range strings.Split(output, "\n") {
		target := strings.TrimSpace(line)
		if target == "" || strings.HasPrefix(target, "Init SSL") {
			continue
		}
		targets = append(targets, target)
	}
	return targets
}

func (c *Collector) readUPSTarget(ctx context.Context, target string) (map[string]string, error) {
	output, err := c.runUPSCommand(ctx, target)
	if err != nil {
		return nil, err
	}

	values := map[string]string{}
	for _, line := range strings.Split(output, "\n") {
		key, value, ok := strings.Cut(line, ":")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		value = strings.TrimSpace(value)
		if key != "" {
			values[key] = value
		}
	}
	if len(values) == 0 {
		return nil, fmt.Errorf("no UPS variables returned for %s", target)
	}
	return values, nil
}

func (c *Collector) runUPSCommand(ctx context.Context, args ...string) (string, error) {
	timeoutCtx, cancel := context.WithTimeout(ctx, c.cfg.UPSTimeout)
	defer cancel()

	cmd := exec.CommandContext(timeoutCtx, c.cfg.UPSCommand, args...)
	output, err := cmd.Output()
	if err != nil {
		return "", err
	}
	return string(output), nil
}

func buildUPSSnapshot(target string, values map[string]string) model.UPSSnapshot {
	status := values["ups.status"]
	statusFields := strings.Fields(status)
	ups := model.UPSSnapshot{
		Name:         firstNonEmpty(values["ups.id"], upsTargetName(target)),
		Model:        firstNonEmpty(values["device.model"], values["ups.model"]),
		Manufacturer: firstNonEmpty(values["device.mfr"], values["ups.mfr"], values["ups.vendorid"]),
		Serial:       firstNonEmpty(values["device.serial"], values["ups.serial"]),
		Status:       status,
		Online:       containsStatus(statusFields, "OL"),
		OnBattery:    containsStatus(statusFields, "OB"),
		LowBattery:   containsStatus(statusFields, "LB"),
	}

	ups.BatteryChargePercent, ups.BatteryChargeAvailable = parseUPSFloat(values["battery.charge"])
	ups.BatteryRuntimeSeconds, ups.BatteryRuntimeAvailable = parseUPSFloat(values["battery.runtime"])
	ups.BatteryVoltage, ups.BatteryVoltageAvailable = parseUPSFloat(values["battery.voltage"])
	ups.InputVoltage, ups.InputVoltageAvailable = parseUPSFloat(values["input.voltage"])
	ups.OutputVoltage, ups.OutputVoltageAvailable = parseUPSFloat(values["output.voltage"])
	if ups.BatteryVoltageAvailable {
		ups.BatteryVoltage = normalizeUPSBatteryVoltage(ups.BatteryVoltage)
		if !validUPSBatteryVoltage(ups.BatteryVoltage, values) {
			ups.BatteryVoltage, ups.BatteryVoltageAvailable = 0, false
		}
	}
	if ups.InputVoltageAvailable && !validUPSMainsVoltage(ups.InputVoltage, values, "input.voltage.nominal") {
		ups.InputVoltage, ups.InputVoltageAvailable = 0, false
	}
	if ups.OutputVoltageAvailable && !validUPSOutputVoltage(ups.OutputVoltage, ups.InputVoltage, ups.InputVoltageAvailable, values) {
		ups.OutputVoltage, ups.OutputVoltageAvailable = 0, false
	}
	ups.LoadPercent, ups.LoadPercentAvailable = parseUPSFloat(values["ups.load"])
	ups.RealPowerWatts, ups.RealPowerWattsAvailable = firstUPSFloat(values, "ups.realpower", "ups.power")
	ups.NominalRealPowerWatts, ups.NominalRealPowerWattsAvailable = firstUPSFloat(values, "ups.realpower.nominal", "ups.power.nominal")
	ups.LineFrequencyHz, ups.LineFrequencyHzAvailable = firstUPSFloat(values, "input.frequency", "output.frequency")
	ups.TemperatureCelsius, ups.TemperatureCelsiusAvailable = firstUPSFloat(values, "ups.temperature", "battery.temperature")

	return ups
}

func upsTargetName(target string) string {
	name, _, _ := strings.Cut(target, "@")
	if strings.TrimSpace(name) == "" {
		return strings.TrimSpace(target)
	}
	return strings.TrimSpace(name)
}

func containsStatus(values []string, want string) bool {
	for _, value := range values {
		if value == want {
			return true
		}
	}
	return false
}

func firstUPSFloat(values map[string]string, keys ...string) (float64, bool) {
	for _, key := range keys {
		if value, ok := parseUPSFloat(values[key]); ok {
			return value, true
		}
	}
	return 0, false
}

func parseUPSFloat(value string) (float64, bool) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return 0, false
	}
	parsed, err := strconv.ParseFloat(trimmed, 64)
	if err != nil {
		return 0, false
	}
	return parsed, true
}

func normalizeUPSBatteryVoltage(value float64) float64 {
	if value > 0 && value < 6 {
		return value * 10
	}
	return value
}

func validUPSBatteryVoltage(value float64, values map[string]string) bool {
	if value < 6 || value > 1000 {
		return false
	}
	if nominal, ok := firstUPSFloat(values, "battery.voltage.nominal"); ok {
		nominal = normalizeUPSBatteryVoltage(nominal)
		if nominal < 6 {
			return false
		}
		return withinUPSVoltageRange(value, nominal)
	}
	return true
}

func validUPSMainsVoltage(value float64, values map[string]string, nominalKey string) bool {
	if value <= 0 || value > 1000 {
		return false
	}
	if nominal, ok := firstUPSFloat(values, nominalKey); ok && nominal >= 80 {
		return withinUPSVoltageRange(value, nominal)
	}
	return value >= 80
}

func validUPSOutputVoltage(value float64, inputVoltage float64, inputVoltageAvailable bool, values map[string]string) bool {
	if value <= 0 || value > 1000 {
		return false
	}
	if nominal, ok := firstUPSFloat(values, "output.voltage.nominal", "input.voltage.nominal"); ok && nominal >= 80 {
		return withinUPSVoltageRange(value, nominal)
	}
	if inputVoltageAvailable && inputVoltage >= 80 {
		return withinUPSVoltageRange(value, inputVoltage)
	}
	return value >= 80
}

func withinUPSVoltageRange(value float64, reference float64) bool {
	return value >= reference*0.5 && value <= reference*1.5
}

func (c *Collector) collectHwmonSensors() []model.SensorSnapshot {
	matches, err := filepath.Glob(filepath.Join(c.cfg.SysFS, "class", "hwmon", "hwmon*"))
	if err != nil {
		return nil
	}

	var result []model.SensorSnapshot
	for _, hwmonPath := range matches {
		chipName := strings.TrimSpace(readTextFile(filepath.Join(hwmonPath, "name")))
		if chipName == "" {
			chipName = filepath.Base(hwmonPath)
		}
		deviceType, deviceName := c.hwmonDeviceAssociation(hwmonPath)

		result = append(result, collectSensorGroup(hwmonPath, chipName, "hwmon", "temp", "temperature", deviceType, deviceName, hwmonTemperatureValue)...)
		result = append(result, collectSensorGroup(hwmonPath, chipName, "hwmon", "fan", "fan", deviceType, deviceName, hwmonRPMValue)...)
	}

	return result
}

func (c *Collector) collectThermalZoneSensors() []model.SensorSnapshot {
	matches, err := filepath.Glob(filepath.Join(c.cfg.SysFS, "class", "thermal", "thermal_zone*"))
	if err != nil {
		return nil
	}

	var result []model.SensorSnapshot
	for _, zonePath := range matches {
		raw, err := readIntFile(filepath.Join(zonePath, "temp"))
		if err != nil || raw <= 0 {
			continue
		}

		zoneName := filepath.Base(zonePath)
		zoneType := strings.TrimSpace(readTextFile(filepath.Join(zonePath, "type")))
		if zoneType == "" {
			zoneType = zoneName
		}

		result = append(result, model.SensorSnapshot{
			Name:       zoneName,
			Label:      zoneType,
			Chip:       zoneType,
			Source:     "thermal",
			Kind:       "temperature",
			Value:      float64(raw) / 1000,
			DeviceType: "host",
		})
	}

	return result
}

func (c *Collector) hwmonDeviceAssociation(hwmonPath string) (string, string) {
	target, err := filepath.EvalSymlinks(filepath.Join(hwmonPath, "device"))
	if err != nil {
		return "host", ""
	}

	disk := findDiskNameInPath(target)
	if disk == "" {
		disk = c.findNVMeNamespaceForPath(target)
	}
	if disk != "" {
		return "disk", disk
	}

	return "host", ""
}

func (c *Collector) resolveHostname() (string, error) {
	if override := strings.TrimSpace(c.cfg.HostnameOverride); override != "" {
		return override, nil
	}

	candidates := []string{}
	if trimmed := strings.TrimSpace(c.cfg.HostnamePath); trimmed != "" {
		candidates = append(candidates, trimmed)
	}
	if hostRoot := c.hostRootPath(); hostRoot != "" {
		candidates = append(candidates,
			filepath.Join(hostRoot, "etc", "hostname"),
			filepath.Join(hostRoot, "proc", "sys", "kernel", "hostname"),
		)
	}
	if trimmed := strings.TrimSpace(c.cfg.ProcFS); trimmed != "" {
		candidates = append(candidates, filepath.Join(trimmed, "sys", "kernel", "hostname"))
	}

	for _, path := range uniqueStrings(candidates) {
		if hostname := strings.TrimSpace(readTextFile(path)); hostname != "" {
			return hostname, nil
		}
	}

	return "", fmt.Errorf("host hostname is unavailable; set UGOS_BRIDGE_HOST_NAME or mount the host hostname file")
}

func collectSensorGroup(basePath string, chipName string, source string, prefix string, kind string, deviceType string, deviceName string, valueFn func(int64) (float64, bool)) []model.SensorSnapshot {
	pattern := filepath.Join(basePath, prefix+"*_input")
	matches, err := filepath.Glob(pattern)
	if err != nil {
		return nil
	}

	var result []model.SensorSnapshot
	for _, inputPath := range matches {
		base := strings.TrimSuffix(filepath.Base(inputPath), "_input")
		raw, err := readIntFile(inputPath)
		if err != nil {
			continue
		}

		value, ok := valueFn(raw)
		if !ok {
			continue
		}

		label := strings.TrimSpace(readTextFile(filepath.Join(basePath, base+"_label")))
		if label == "" {
			label = base
		}

		result = append(result, model.SensorSnapshot{
			Name:       base,
			Label:      label,
			Chip:       chipName,
			Source:     source,
			Kind:       kind,
			Value:      value,
			DeviceType: deviceType,
			DeviceName: deviceName,
		})
	}

	return result
}

func hwmonTemperatureValue(raw int64) (float64, bool) {
	if raw <= 0 {
		return 0, false
	}
	return float64(raw) / 1000, true
}

func hwmonRPMValue(raw int64) (float64, bool) {
	if raw < 0 {
		return 0, false
	}
	return float64(raw), true
}

func cpuUsagePercent(prev procfs.CPUStat, current procfs.CPUStat) float64 {
	prevTotal := cpuTotal(prev)
	currTotal := cpuTotal(current)
	if prevTotal == 0 {
		return 0
	}
	deltaTotal := currTotal - prevTotal
	if deltaTotal <= 0 {
		return 0
	}

	deltaIdle := current.Idle - prev.Idle
	usage := ((deltaTotal - deltaIdle) / deltaTotal) * 100
	if usage < 0 {
		return 0
	}
	if usage > 100 {
		return 100
	}
	return usage
}

func cpuTotal(stat procfs.CPUStat) float64 {
	return stat.User + stat.Nice + stat.System + stat.Idle + stat.Iowait + stat.IRQ + stat.SoftIRQ + stat.Steal + stat.Guest + stat.GuestNice
}

func valueOrZero(value *uint64) uint64 {
	if value == nil {
		return 0
	}
	return *value
}

func readMounts(path string) (map[string]mountEntry, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	result := map[string]mountEntry{}
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) < 3 {
			continue
		}
		mountpoint := unescapeMountField(fields[1])
		result[mountpoint] = mountEntry{
			source:     unescapeMountField(fields[0]),
			mountpoint: mountpoint,
			fsType:     fields[2],
			readOnly:   mountHasReadOnly(fields),
		}
	}
	return result, scanner.Err()
}

func readMountInfo(path string) (map[string]mountEntry, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	result := map[string]mountEntry{}
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		separator := -1
		for idx, field := range fields {
			if field == "-" {
				separator = idx
				break
			}
		}
		if separator < 0 || separator+3 >= len(fields) || len(fields) < 6 {
			continue
		}

		mountpoint := unescapeMountField(fields[4])
		result[mountpoint] = mountEntry{
			source:     unescapeMountField(fields[separator+2]),
			mountpoint: mountpoint,
			fsType:     fields[separator+1],
			readOnly:   mountOptionsHaveReadOnly(fields[5]) || mountOptionsHaveReadOnly(fields[separator+3]),
		}
	}
	return result, scanner.Err()
}

func (c *Collector) readHostMounts() (map[string]mountEntry, error) {
	candidates := []string{}
	if hostRoot := c.hostRootPath(); hostRoot != "" {
		candidates = append(candidates,
			filepath.Join(hostRoot, "proc", "1", "mountinfo"),
			filepath.Join(hostRoot, "proc", "mounts"),
		)
	}
	if trimmed := strings.TrimSpace(c.cfg.ProcFS); trimmed != "" {
		candidates = append(candidates,
			filepath.Join(trimmed, "1", "mountinfo"),
			filepath.Join(trimmed, "mounts"),
		)
	}

	var lastErr error
	for _, path := range uniqueStrings(candidates) {
		var (
			mounts map[string]mountEntry
			err    error
		)
		if strings.HasSuffix(path, "mountinfo") {
			mounts, err = readMountInfo(path)
		} else {
			mounts, err = readMounts(path)
		}
		if err == nil && len(mounts) > 0 {
			return mounts, nil
		}
		if err != nil {
			lastErr = err
		}
	}

	if lastErr != nil {
		return nil, lastErr
	}
	return nil, fmt.Errorf("no mount metadata available")
}

func mountHasReadOnly(fields []string) bool {
	if len(fields) < 4 {
		return false
	}
	return mountOptionsHaveReadOnly(fields[3])
}

func mountOptionsHaveReadOnly(raw string) bool {
	for _, option := range strings.Split(raw, ",") {
		if strings.TrimSpace(option) == "ro" {
			return true
		}
	}
	return false
}

func unescapeMountField(value string) string {
	replacer := strings.NewReplacer(`\040`, " ", `\011`, "\t", `\012`, "\n", `\134`, `\`)
	return replacer.Replace(value)
}

func mountpointsForDevice(mounts map[string]mountEntry, device string) []string {
	var result []string
	want := "/dev/" + device
	for _, mount := range mounts {
		if mount.source == want {
			result = append(result, mount.mountpoint)
		}
	}
	sort.Strings(result)
	return result
}

func isOverlayFilesystem(entry mountEntry) bool {
	return entry.fsType == "overlay" || entry.source == "overlay"
}

func (c *Collector) arrayNameFromSource(source string) string {
	trimmed := strings.TrimSpace(source)
	if trimmed == "" {
		return ""
	}
	base := filepath.Base(trimmed)
	if strings.HasPrefix(base, "md") {
		return base
	}
	if strings.HasPrefix(base, "dm-") {
		if array := c.findBackingMDDevice(base); array != "" {
			return array
		}
	}
	if strings.HasPrefix(trimmed, "/dev/mapper/") {
		if dmDevice := c.dmDeviceForMapper(base); dmDevice != "" {
			if array := c.findBackingMDDevice(dmDevice); array != "" {
				return array
			}
		}
		if matches := poolMapperPattern.FindStringSubmatch(base); len(matches) == 2 {
			if poolIndex := strings.TrimPrefix(matches[1], "pool"); poolIndex != "" {
				return "md" + poolIndex
			}
		}
	}
	return ""
}

func (c *Collector) dmDeviceForMapper(mapperName string) string {
	matches, err := filepath.Glob(filepath.Join(c.cfg.SysFS, "block", "dm-*"))
	if err != nil {
		return ""
	}

	for _, match := range matches {
		name := strings.TrimSpace(readTextFile(filepath.Join(match, "dm", "name")))
		if name == mapperName {
			return filepath.Base(match)
		}
	}
	return ""
}

func (c *Collector) findBackingMDDevice(device string) string {
	seen := map[string]struct{}{}
	return c.findBackingMDDeviceRecursive(device, seen)
}

func (c *Collector) findBackingMDDeviceRecursive(device string, seen map[string]struct{}) string {
	device = strings.TrimSpace(device)
	if device == "" {
		return ""
	}
	if _, ok := seen[device]; ok {
		return ""
	}
	seen[device] = struct{}{}

	if strings.HasPrefix(device, "md") {
		return device
	}

	slaves, err := filepath.Glob(filepath.Join(c.cfg.SysFS, "block", device, "slaves", "*"))
	if err != nil {
		return ""
	}
	for _, slave := range slaves {
		if array := c.findBackingMDDeviceRecursive(filepath.Base(slave), seen); array != "" {
			return array
		}
	}
	return ""
}

func (c *Collector) findNVMeNamespaceForPath(path string) string {
	controller := findNVMeControllerInPath(path)
	if controller == "" {
		return ""
	}

	matches, err := filepath.Glob(filepath.Join(c.cfg.SysFS, "block", controller+"n*"))
	if err != nil {
		return ""
	}

	var namespaces []string
	for _, match := range matches {
		name := filepath.Base(match)
		if isPhysicalDisk(name) {
			namespaces = append(namespaces, name)
		}
	}
	sort.Strings(namespaces)
	if len(namespaces) == 1 {
		return namespaces[0]
	}
	return ""
}

func readTextFile(path string) string {
	data, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	return string(data)
}

func readUintFile(path string) (uint64, error) {
	raw := strings.TrimSpace(readTextFile(path))
	if raw == "" {
		return 0, fmt.Errorf("empty file %s", path)
	}
	return strconv.ParseUint(raw, 10, 64)
}

func readIntFile(path string) (int64, error) {
	raw := strings.TrimSpace(readTextFile(path))
	if raw == "" {
		return 0, fmt.Errorf("empty file %s", path)
	}
	return strconv.ParseInt(raw, 10, 64)
}

func readIntFileOrZero(path string) int64 {
	value, err := readIntFile(path)
	if err != nil {
		return 0
	}
	return value
}

func readFirstUint(paths ...string) (uint64, bool) {
	for _, path := range paths {
		value, err := readUintFile(path)
		if err == nil {
			return value, true
		}
	}
	return 0, false
}

func parseUEventValue(raw string, key string) string {
	prefix := key + "="
	for _, line := range strings.Split(raw, "\n") {
		if strings.HasPrefix(line, prefix) {
			return strings.TrimSpace(strings.TrimPrefix(line, prefix))
		}
	}
	return ""
}

func firstField(value string) string {
	fields := strings.Fields(value)
	if len(fields) == 0 {
		return ""
	}
	return fields[0]
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

func findDiskNameInPath(path string) string {
	clean := filepath.Clean(path)
	parts := strings.FieldsFunc(clean, func(r rune) bool {
		return r == '\\' || r == '/'
	})

	for idx := len(parts) - 1; idx >= 0; idx-- {
		part := parts[idx]
		if isPhysicalDisk(part) {
			return part
		}
	}

	return ""
}

func findNVMeControllerInPath(path string) string {
	clean := filepath.Clean(path)
	parts := strings.FieldsFunc(clean, func(r rune) bool {
		return r == '\\' || r == '/'
	})

	for idx := len(parts) - 1; idx >= 0; idx-- {
		part := parts[idx]
		if isNVMeController(part) {
			return part
		}
	}

	return ""
}

func isPhysicalDisk(name string) bool {
	switch {
	case strings.HasPrefix(name, "sd"):
		return len(name) == 3
	case strings.HasPrefix(name, "hd"):
		return len(name) == 3
	case strings.HasPrefix(name, "vd"):
		return len(name) == 3
	case strings.HasPrefix(name, "xvd"):
		return len(name) == 4
	case strings.HasPrefix(name, "nvme"):
		return nvmeDiskPattern.MatchString(name)
	case strings.HasPrefix(name, "mmcblk"):
		return mmcDiskPattern.MatchString(name)
	default:
		return false
	}
}

func isNVMeController(name string) bool {
	return nvmeControllerPat.MatchString(name)
}

func (c *Collector) hostRootPath() string {
	for _, fs := range c.cfg.Filesystems {
		if fs.Name == "/" && strings.TrimSpace(fs.ContainerPath) != "" {
			return fs.ContainerPath
		}
	}
	return ""
}

func uniqueStrings(values []string) []string {
	seen := map[string]struct{}{}
	result := make([]string, 0, len(values))
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			continue
		}
		if _, ok := seen[trimmed]; ok {
			continue
		}
		seen[trimmed] = struct{}{}
		result = append(result, trimmed)
	}
	return result
}

func diskType(name string, rotational bool) string {
	if strings.HasPrefix(name, "nvme") {
		return "nvme"
	}
	if rotational {
		return "hdd"
	}
	return "ssd"
}

func rateUint64(current uint64, previous uint64, elapsed float64) float64 {
	if elapsed <= 0 || current < previous {
		return 0
	}
	return float64(current-previous) / elapsed
}

func percentUint64(current uint64, previous uint64, total float64) float64 {
	if total <= 0 || current < previous {
		return 0
	}
	value := (float64(current-previous) / total) * 100
	if value < 0 {
		return 0
	}
	if value > 100 {
		return 100
	}
	return value
}

func clampPercent(value float64) float64 {
	if value < 0 {
		return 0
	}
	if value > 100 {
		return 100
	}
	return value
}

func compileRegexList(values []string, defaults []string) ([]*regexp.Regexp, error) {
	source := values
	if len(source) == 0 {
		source = defaults
	}

	result := make([]*regexp.Regexp, 0, len(source))
	for _, value := range source {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			continue
		}
		compiled, err := regexp.Compile("^(?:" + trimmed + ")$")
		if err != nil {
			return nil, err
		}
		result = append(result, compiled)
	}
	return result, nil
}

func matchesRegex(value string, patterns []*regexp.Regexp) bool {
	if len(patterns) == 0 {
		return true
	}
	for _, pattern := range patterns {
		if pattern.MatchString(value) {
			return true
		}
	}
	return false
}
