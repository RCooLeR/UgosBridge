package prometheusoutput

import (
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"

	"github.com/RCooLeR/UgosBridge/bridge/internal/model"
)

type Metrics struct {
	containerCPU                    *prometheus.GaugeVec
	containerMemory                 *prometheus.GaugeVec
	containerMemoryLimit            *prometheus.GaugeVec
	containerRunning                *prometheus.GaugeVec
	containerStatsOK                *prometheus.GaugeVec
	containerCPUSeconds             *prometheus.GaugeVec
	containerCPUUserSeconds         *prometheus.GaugeVec
	containerCPUSystemSeconds       *prometheus.GaugeVec
	containerCPUCFSPeriods          *prometheus.GaugeVec
	containerCPUCFSThrottledPeriods *prometheus.GaugeVec
	containerCPUCFSThrottledSeconds *prometheus.GaugeVec
	containerSpecCPUQuota           *prometheus.GaugeVec
	containerSpecCPUPeriod          *prometheus.GaugeVec
	containerSpecCPUShares          *prometheus.GaugeVec
	containerMemoryRaw              *prometheus.GaugeVec
	containerMemoryWorkingSet       *prometheus.GaugeVec
	containerMemoryMaxUsage         *prometheus.GaugeVec
	containerMemoryRSS              *prometheus.GaugeVec
	containerMemoryCache            *prometheus.GaugeVec
	containerMemorySwap             *prometheus.GaugeVec
	containerMemoryFailCount        *prometheus.GaugeVec
	containerSpecMemoryLimit        *prometheus.GaugeVec
	containerSpecMemorySwapLimit    *prometheus.GaugeVec
	containerOOMKilled              *prometheus.GaugeVec
	containerOOMEvents              *prometheus.GaugeVec
	containerStartTime              *prometheus.GaugeVec
	containerHealth                 *prometheus.GaugeVec
	containerPIDsCurrent            *prometheus.GaugeVec
	containerNetworkBytes           *prometheus.GaugeVec
	containerNetworkPackets         *prometheus.GaugeVec
	containerNetworkErrors          *prometheus.GaugeVec
	containerNetworkDrops           *prometheus.GaugeVec
	containerBlockIOBytes           *prometheus.GaugeVec
	containerBlockIOOperations      *prometheus.GaugeVec
	containerBlockIOTime            *prometheus.GaugeVec
	containerFilesystemSize         *prometheus.GaugeVec
	projectCPU                      *prometheus.GaugeVec
	projectMemory                   *prometheus.GaugeVec
	projectTotal                    *prometheus.GaugeVec
	projectRunning                  *prometheus.GaugeVec

	hostInfo               *prometheus.GaugeVec
	hostCPU                *prometheus.GaugeVec
	hostCPUCore            *prometheus.GaugeVec
	hostCPUFrequency       *prometheus.GaugeVec
	hostCPUGovernorInfo    *prometheus.GaugeVec
	hostLoad               *prometheus.GaugeVec
	hostUptime             *prometheus.GaugeVec
	hostContextSwitches    *prometheus.GaugeVec
	hostProcessesRunning   *prometheus.GaugeVec
	hostProcessesBlocked   *prometheus.GaugeVec
	hostMemory             *prometheus.GaugeVec
	hostFilesystemBytes    *prometheus.GaugeVec
	hostFilesystemInodes   *prometheus.GaugeVec
	hostFilesystemReadOnly *prometheus.GaugeVec
	hostDiskInfo           *prometheus.GaugeVec
	hostDiskSize           *prometheus.GaugeVec
	hostDiskReadBytes      *prometheus.GaugeVec
	hostDiskWriteBytes     *prometheus.GaugeVec
	hostDiskReadIOPS       *prometheus.GaugeVec
	hostDiskWriteIOPS      *prometheus.GaugeVec
	hostDiskBusy           *prometheus.GaugeVec
	hostArraySize          *prometheus.GaugeVec
	hostArrayDisks         *prometheus.GaugeVec
	hostArraySync          *prometheus.GaugeVec
	hostBondInfo           *prometheus.GaugeVec
	hostBondSpeed          *prometheus.GaugeVec
	hostBondCarrier        *prometheus.GaugeVec
	hostBondSlaves         *prometheus.GaugeVec
	hostBondSlaveInfo      *prometheus.GaugeVec
	hostBondSlaveSpeed     *prometheus.GaugeVec
	hostBondSlaveCarrier   *prometheus.GaugeVec
	hostNetworkInfo        *prometheus.GaugeVec
	hostNetworkSpeed       *prometheus.GaugeVec
	hostNetworkCarrier     *prometheus.GaugeVec
	hostNetworkBytes       *prometheus.GaugeVec
	hostNetworkThroughput  *prometheus.GaugeVec
	hostNetworkPackets     *prometheus.GaugeVec
	hostNetworkErrors      *prometheus.GaugeVec
	hostNetworkDrops       *prometheus.GaugeVec
	hostGPUInfo            *prometheus.GaugeVec
	hostGPUBusy            *prometheus.GaugeVec
	hostGPUFrequency       *prometheus.GaugeVec
	hostGPUEngine          *prometheus.GaugeVec
	hostGPUStat            *prometheus.GaugeVec
	hostTemperature        *prometheus.GaugeVec
	hostFanSpeed           *prometheus.GaugeVec
	hostCoolingState       *prometheus.GaugeVec
	hostCoolingPercent     *prometheus.GaugeVec
	hostUPSInfo            *prometheus.GaugeVec
	hostUPSStatus          *prometheus.GaugeVec
	hostUPSOnline          *prometheus.GaugeVec
	hostUPSOnBattery       *prometheus.GaugeVec
	hostUPSLowBattery      *prometheus.GaugeVec
	hostUPSCharge          *prometheus.GaugeVec
	hostUPSRuntime         *prometheus.GaugeVec
	hostUPSVoltage         *prometheus.GaugeVec
	hostUPSLoad            *prometheus.GaugeVec
	hostUPSPower           *prometheus.GaugeVec
	hostUPSFrequency       *prometheus.GaugeVec
	hostUPSTemperature     *prometheus.GaugeVec
	hostProcessCount       *prometheus.GaugeVec
	hostProcessCPU         *prometheus.GaugeVec
	hostProcessMemory      *prometheus.GaugeVec
	hostProcessCPUTime     *prometheus.GaugeVec
	hostVMInfo             *prometheus.GaugeVec
	hostVMRunning          *prometheus.GaugeVec
	hostVMVCPUs            *prometheus.GaugeVec
	hostVMCPU              *prometheus.GaugeVec
	hostVMCPUTime          *prometheus.GaugeVec
	hostVMMemory           *prometheus.GaugeVec
	hostVMBlockBytes       *prometheus.GaugeVec
	hostVMNetworkBytes     *prometheus.GaugeVec

	up             prometheus.Gauge
	lastCollection prometheus.Gauge
	statsErrors    prometheus.Gauge
}

func NewMetrics(registry prometheus.Registerer) *Metrics {
	m := &Metrics{
		containerCPU: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_cpu_usage_percent",
			Help: "CPU usage percentage by container.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerMemory: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_memory_usage_bytes",
			Help: "Effective working-set style memory usage by container in bytes.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerMemoryLimit: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_memory_limit_bytes",
			Help: "Configured memory limit by container in bytes.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerRunning: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_running",
			Help: "Whether the container is running (1) or not (0).",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerStatsOK: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_stats_collected",
			Help: "Whether container stats were collected successfully (1) or not (0).",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerCPUSeconds: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_cpu_usage_seconds_total",
			Help: "Total CPU time consumed by the container in seconds.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerCPUUserSeconds: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_cpu_user_seconds_total",
			Help: "User-mode CPU time consumed by the container in seconds.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerCPUSystemSeconds: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_cpu_system_seconds_total",
			Help: "Kernel-mode CPU time consumed by the container in seconds.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerCPUCFSPeriods: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_cpu_cfs_periods_total",
			Help: "Completely elapsed CFS periods for the container.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerCPUCFSThrottledPeriods: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_cpu_cfs_throttled_periods_total",
			Help: "CFS periods in which the container was throttled.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerCPUCFSThrottledSeconds: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_cpu_cfs_throttled_seconds_total",
			Help: "Total throttled CFS time for the container in seconds.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerSpecCPUQuota: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_spec_cpu_quota",
			Help: "Configured CPU CFS quota for the container in microseconds.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerSpecCPUPeriod: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_spec_cpu_period",
			Help: "Configured CPU CFS period for the container in microseconds.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerSpecCPUShares: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_spec_cpu_shares",
			Help: "Configured CPU shares for the container.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerMemoryRaw: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_memory_usage_raw_bytes",
			Help: "Raw memory usage reported by Docker for the container in bytes.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerMemoryWorkingSet: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_memory_working_set_bytes",
			Help: "Working-set memory usage by container in bytes.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerMemoryMaxUsage: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_memory_max_usage_bytes",
			Help: "Peak memory usage reported for the container in bytes.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerMemoryRSS: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_memory_rss_bytes",
			Help: "RSS memory usage by container in bytes.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerMemoryCache: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_memory_cache_bytes",
			Help: "Page cache memory usage by container in bytes.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerMemorySwap: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_memory_swap_bytes",
			Help: "Swap memory usage by container in bytes.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerMemoryFailCount: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_memory_fail_count",
			Help: "Memory allocation failures reported for the container.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerSpecMemoryLimit: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_spec_memory_limit_bytes",
			Help: "Configured memory limit for the container in bytes.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerSpecMemorySwapLimit: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_spec_memory_swap_limit_bytes",
			Help: "Configured swap-inclusive memory limit for the container in bytes.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerOOMKilled: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_oom_killed",
			Help: "Whether Docker reports the container as OOM-killed.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerOOMEvents: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_oom_events_total",
			Help: "Count of Docker OOM events observed for the container since bridge start.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerStartTime: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_start_time_seconds",
			Help: "Container start time since Unix epoch in seconds.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerHealth: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_health_status",
			Help: "Container health status as a labeled info-style gauge.",
		}, []string{"container_id", "container", "project", "image", "state", "health"}),
		containerPIDsCurrent: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_pids_current",
			Help: "Current PID count inside the container.",
		}, []string{"container_id", "container", "project", "image", "state"}),
		containerNetworkBytes: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_network_bytes_total",
			Help: "Container network byte counters by interface and direction.",
		}, []string{"container_id", "container", "project", "image", "state", "interface", "direction"}),
		containerNetworkPackets: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_network_packets_total",
			Help: "Container network packet counters by interface and direction.",
		}, []string{"container_id", "container", "project", "image", "state", "interface", "direction"}),
		containerNetworkErrors: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_network_errors_total",
			Help: "Container network error counters by interface and direction.",
		}, []string{"container_id", "container", "project", "image", "state", "interface", "direction"}),
		containerNetworkDrops: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_network_dropped_total",
			Help: "Container network dropped packet counters by interface and direction.",
		}, []string{"container_id", "container", "project", "image", "state", "interface", "direction"}),
		containerBlockIOBytes: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_blkio_bytes_total",
			Help: "Container block I/O byte counters by operation.",
		}, []string{"container_id", "container", "project", "image", "state", "operation"}),
		containerBlockIOOperations: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_blkio_operations_total",
			Help: "Container block I/O operation counters by operation.",
		}, []string{"container_id", "container", "project", "image", "state", "operation"}),
		containerBlockIOTime: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_blkio_time_seconds_total",
			Help: "Container block I/O time counters in seconds by type.",
		}, []string{"container_id", "container", "project", "image", "state", "type"}),
		containerFilesystemSize: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_filesystem_size_bytes",
			Help: "Container filesystem sizes in bytes by type.",
		}, []string{"container_id", "container", "project", "image", "state", "type"}),
		projectCPU: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_project_cpu_usage_percent",
			Help: "Aggregated CPU usage percentage by project.",
		}, []string{"project", "running", "total"}),
		projectMemory: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_project_memory_usage_bytes",
			Help: "Aggregated memory usage by project in bytes.",
		}, []string{"project", "running", "total"}),
		projectTotal: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_project_total_containers",
			Help: "Total containers in the project.",
		}, []string{"project", "running", "total"}),
		projectRunning: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_project_running_containers",
			Help: "Running containers in the project.",
		}, []string{"project", "running", "total"}),

		hostInfo: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_info",
			Help: "Static host metadata.",
		}, []string{"host"}),
		hostCPU: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_cpu_usage_percent",
			Help: "Overall host CPU usage percent.",
		}, []string{"host"}),
		hostCPUCore: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_cpu_core_usage_percent",
			Help: "Per-core host CPU usage percent.",
		}, []string{"host", "cpu"}),
		hostCPUFrequency: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_cpu_frequency_mhz",
			Help: "Host CPU frequency in MHz by core and type.",
		}, []string{"host", "cpu", "type"}),
		hostCPUGovernorInfo: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_cpu_governor_info",
			Help: "Host CPU governor information by core.",
		}, []string{"host", "cpu", "governor"}),
		hostLoad: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_load_average",
			Help: "Host load average by window.",
		}, []string{"host", "window"}),
		hostUptime: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_uptime_seconds",
			Help: "Host uptime in seconds.",
		}, []string{"host"}),
		hostContextSwitches: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_context_switches",
			Help: "Host context switch count from /proc/stat.",
		}, []string{"host"}),
		hostProcessesRunning: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_processes_running",
			Help: "Host processes currently running.",
		}, []string{"host"}),
		hostProcessesBlocked: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_processes_blocked",
			Help: "Host processes currently blocked on I/O.",
		}, []string{"host"}),
		hostMemory: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_memory_bytes",
			Help: "Host memory values in bytes by type.",
		}, []string{"host", "type"}),
		hostFilesystemBytes: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_filesystem_bytes",
			Help: "Host filesystem values in bytes by type.",
		}, []string{"host", "filesystem", "mountpoint", "source", "fstype", "array", "type"}),
		hostFilesystemInodes: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_filesystem_inodes",
			Help: "Host filesystem inode values by type.",
		}, []string{"host", "filesystem", "mountpoint", "source", "fstype", "array", "type"}),
		hostFilesystemReadOnly: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_filesystem_readonly",
			Help: "Whether a host filesystem is read-only.",
		}, []string{"host", "filesystem", "mountpoint", "source", "fstype", "array"}),
		hostDiskInfo: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_disk_info",
			Help: "Static host disk metadata.",
		}, []string{"host", "disk", "type", "vendor", "model", "serial"}),
		hostDiskSize: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_disk_size_bytes",
			Help: "Host disk size in bytes.",
		}, []string{"host", "disk", "type"}),
		hostDiskReadBytes: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_disk_read_bytes_per_second",
			Help: "Host disk read throughput in bytes per second.",
		}, []string{"host", "disk", "type"}),
		hostDiskWriteBytes: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_disk_write_bytes_per_second",
			Help: "Host disk write throughput in bytes per second.",
		}, []string{"host", "disk", "type"}),
		hostDiskReadIOPS: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_disk_read_iops",
			Help: "Host disk read IOPS.",
		}, []string{"host", "disk", "type"}),
		hostDiskWriteIOPS: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_disk_write_iops",
			Help: "Host disk write IOPS.",
		}, []string{"host", "disk", "type"}),
		hostDiskBusy: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_disk_busy_percent",
			Help: "Host disk busy percentage.",
		}, []string{"host", "disk", "type"}),
		hostArraySize: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_array_size_bytes",
			Help: "Host md array size in bytes.",
		}, []string{"host", "array", "level", "state"}),
		hostArrayDisks: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_array_disks",
			Help: "Host md array disk counts by type.",
		}, []string{"host", "array", "level", "state", "type"}),
		hostArraySync: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_array_sync_percent",
			Help: "Host md array sync completion percentage.",
		}, []string{"host", "array", "level", "state", "action"}),
		hostBondInfo: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_bond_info",
			Help: "Static host bond metadata.",
		}, []string{"host", "bond", "mode", "active_slave", "primary", "mii_status", "state"}),
		hostBondSpeed: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_bond_speed_mbps",
			Help: "Host bond reported link speed in Mbps.",
		}, []string{"host", "bond"}),
		hostBondCarrier: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_bond_carrier",
			Help: "Whether the host bond carrier is up.",
		}, []string{"host", "bond"}),
		hostBondSlaves: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_bond_slaves",
			Help: "Host bond slave counts by type.",
		}, []string{"host", "bond", "type"}),
		hostBondSlaveInfo: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_bond_slave_info",
			Help: "Static host bond slave metadata.",
		}, []string{"host", "bond", "slave", "mii_status", "state", "duplex", "active"}),
		hostBondSlaveSpeed: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_bond_slave_speed_mbps",
			Help: "Host bond slave reported link speed in Mbps.",
		}, []string{"host", "bond", "slave"}),
		hostBondSlaveCarrier: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_bond_slave_carrier",
			Help: "Whether the host bond slave carrier is up.",
		}, []string{"host", "bond", "slave"}),
		hostNetworkInfo: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_network_info",
			Help: "Static host network interface metadata.",
		}, []string{"host", "interface", "mac", "state", "duplex"}),
		hostNetworkSpeed: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_network_speed_mbps",
			Help: "Host network interface reported link speed in Mbps.",
		}, []string{"host", "interface"}),
		hostNetworkCarrier: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_network_carrier",
			Help: "Whether the host network interface carrier is up.",
		}, []string{"host", "interface"}),
		hostNetworkBytes: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_network_bytes",
			Help: "Host network byte counters by direction.",
		}, []string{"host", "interface", "direction"}),
		hostNetworkThroughput: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_network_bytes_per_second",
			Help: "Host network throughput in bytes per second by direction.",
		}, []string{"host", "interface", "direction"}),
		hostNetworkPackets: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_network_packets",
			Help: "Host network packet counters by direction.",
		}, []string{"host", "interface", "direction"}),
		hostNetworkErrors: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_network_errors",
			Help: "Host network error counters by direction.",
		}, []string{"host", "interface", "direction"}),
		hostNetworkDrops: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_network_dropped",
			Help: "Host network dropped packet counters by direction.",
		}, []string{"host", "interface", "direction"}),
		hostGPUInfo: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_gpu_info",
			Help: "Static host GPU metadata.",
		}, []string{"host", "gpu", "driver", "vendor", "device"}),
		hostGPUBusy: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_gpu_busy_percent",
			Help: "Host GPU busy percentage when exposed by the driver.",
		}, []string{"host", "gpu", "driver"}),
		hostGPUFrequency: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_gpu_frequency_mhz",
			Help: "Host GPU frequencies in MHz by type.",
		}, []string{"host", "gpu", "driver", "type"}),
		hostGPUEngine: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_gpu_engine_percent",
			Help: "Host GPU engine utilisation percentages from intel_gpu_top.",
		}, []string{"host", "gpu", "driver", "engine", "type"}),
		hostGPUStat: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_gpu_stat",
			Help: "Host GPU stats from intel_gpu_top by type.",
		}, []string{"host", "gpu", "driver", "type"}),
		hostTemperature: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_temperature_celsius",
			Help: "Host temperature sensors in degrees Celsius.",
		}, []string{"host", "sensor", "chip", "label", "source", "device_type", "device"}),
		hostFanSpeed: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_fan_speed_rpm",
			Help: "Host fan speed sensors in RPM.",
		}, []string{"host", "sensor", "chip", "label", "source", "device_type", "device"}),
		hostCoolingState: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_cooling_device_state",
			Help: "Host thermal cooling device state by type.",
		}, []string{"host", "device", "type", "state"}),
		hostCoolingPercent: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_cooling_device_percent",
			Help: "Host thermal cooling device state normalized to percent when max_state is available.",
		}, []string{"host", "device", "type"}),
		hostUPSInfo: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_ups_info",
			Help: "Static UPS metadata discovered through NUT.",
		}, []string{"host", "ups", "manufacturer", "model", "serial"}),
		hostUPSStatus: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_ups_status_info",
			Help: "UPS status as a labeled info-style gauge.",
		}, []string{"host", "ups", "status"}),
		hostUPSOnline: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_ups_online",
			Help: "Whether the UPS reports online utility power.",
		}, []string{"host", "ups"}),
		hostUPSOnBattery: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_ups_on_battery",
			Help: "Whether the UPS reports running on battery.",
		}, []string{"host", "ups"}),
		hostUPSLowBattery: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_ups_low_battery",
			Help: "Whether the UPS reports a low battery condition.",
		}, []string{"host", "ups"}),
		hostUPSCharge: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_ups_battery_charge_percent",
			Help: "UPS battery charge percent.",
		}, []string{"host", "ups"}),
		hostUPSRuntime: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_ups_battery_runtime_seconds",
			Help: "Estimated UPS battery runtime in seconds.",
		}, []string{"host", "ups"}),
		hostUPSVoltage: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_ups_voltage",
			Help: "UPS voltage values by type.",
		}, []string{"host", "ups", "type"}),
		hostUPSLoad: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_ups_load_percent",
			Help: "UPS load percent.",
		}, []string{"host", "ups"}),
		hostUPSPower: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_ups_power_watts",
			Help: "UPS power values in watts by type.",
		}, []string{"host", "ups", "type"}),
		hostUPSFrequency: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_ups_line_frequency_hz",
			Help: "UPS line frequency in Hz.",
		}, []string{"host", "ups"}),
		hostUPSTemperature: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_ups_temperature_celsius",
			Help: "UPS temperature in degrees Celsius.",
		}, []string{"host", "ups"}),
		hostProcessCount: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_process_group_count",
			Help: "Number of OS processes in a grouped host software entry. Exported for the top host software groups by CPU usage.",
		}, []string{"host", "software"}),
		hostProcessCPU: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_process_group_cpu_usage_percent",
			Help: "CPU usage percentage for a grouped host software entry. Exported for the top host software groups by CPU usage.",
		}, []string{"host", "software"}),
		hostProcessMemory: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_process_group_memory_bytes",
			Help: "Resident memory usage for a grouped host software entry. Exported for the top host software groups by CPU usage.",
		}, []string{"host", "software"}),
		hostProcessCPUTime: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_process_group_cpu_time_seconds",
			Help: "Accumulated CPU time for a grouped host software entry. Exported for the top host software groups by CPU usage.",
		}, []string{"host", "software"}),
		hostVMInfo: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_vm_info",
			Help: "Static virtual machine metadata discovered from libvirt.",
		}, []string{"host", "ugos_vm_id", "vm", "source_name", "state", "iso_path"}),
		hostVMRunning: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_vm_running",
			Help: "Whether the virtual machine is running (1) or not (0).",
		}, []string{"host", "ugos_vm_id", "vm"}),
		hostVMVCPUs: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_vm_vcpus",
			Help: "Configured or current virtual CPU count for the virtual machine.",
		}, []string{"host", "ugos_vm_id", "vm"}),
		hostVMCPU: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_vm_cpu_usage_percent",
			Help: "Virtual machine CPU usage percentage based on libvirt cpu.time deltas.",
		}, []string{"host", "ugos_vm_id", "vm"}),
		hostVMCPUTime: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_vm_cpu_time_seconds",
			Help: "Virtual machine accumulated CPU time in seconds.",
		}, []string{"host", "ugos_vm_id", "vm"}),
		hostVMMemory: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_vm_memory_bytes",
			Help: "Virtual machine memory values in bytes by type.",
		}, []string{"host", "ugos_vm_id", "vm", "type"}),
		hostVMBlockBytes: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_vm_block_bytes_total",
			Help: "Virtual machine aggregate block I/O counters by direction.",
		}, []string{"host", "ugos_vm_id", "vm", "direction"}),
		hostVMNetworkBytes: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "ugos_bridge_host_vm_network_bytes_total",
			Help: "Virtual machine aggregate network byte counters by direction.",
		}, []string{"host", "ugos_vm_id", "vm", "direction"}),

		up: prometheus.NewGauge(prometheus.GaugeOpts{
			Name: "ugos_bridge_up",
			Help: "Whether the last collection succeeded.",
		}),
		lastCollection: prometheus.NewGauge(prometheus.GaugeOpts{
			Name: "ugos_bridge_last_collection_timestamp_seconds",
			Help: "Unix timestamp of the last collection attempt.",
		}),
		statsErrors: prometheus.NewGauge(prometheus.GaugeOpts{
			Name: "ugos_bridge_container_stats_errors",
			Help: "Number of container stats fetches that failed during the last collection.",
		}),
	}

	registry.MustRegister(
		m.containerCPU,
		m.containerMemory,
		m.containerMemoryLimit,
		m.containerRunning,
		m.containerStatsOK,
		m.containerCPUSeconds,
		m.containerCPUUserSeconds,
		m.containerCPUSystemSeconds,
		m.containerCPUCFSPeriods,
		m.containerCPUCFSThrottledPeriods,
		m.containerCPUCFSThrottledSeconds,
		m.containerSpecCPUQuota,
		m.containerSpecCPUPeriod,
		m.containerSpecCPUShares,
		m.containerMemoryRaw,
		m.containerMemoryWorkingSet,
		m.containerMemoryMaxUsage,
		m.containerMemoryRSS,
		m.containerMemoryCache,
		m.containerMemorySwap,
		m.containerMemoryFailCount,
		m.containerSpecMemoryLimit,
		m.containerSpecMemorySwapLimit,
		m.containerOOMKilled,
		m.containerOOMEvents,
		m.containerStartTime,
		m.containerHealth,
		m.containerPIDsCurrent,
		m.containerNetworkBytes,
		m.containerNetworkPackets,
		m.containerNetworkErrors,
		m.containerNetworkDrops,
		m.containerBlockIOBytes,
		m.containerBlockIOOperations,
		m.containerBlockIOTime,
		m.containerFilesystemSize,
		m.projectCPU,
		m.projectMemory,
		m.projectTotal,
		m.projectRunning,
		m.hostInfo,
		m.hostCPU,
		m.hostCPUCore,
		m.hostCPUFrequency,
		m.hostCPUGovernorInfo,
		m.hostLoad,
		m.hostUptime,
		m.hostContextSwitches,
		m.hostProcessesRunning,
		m.hostProcessesBlocked,
		m.hostMemory,
		m.hostFilesystemBytes,
		m.hostFilesystemInodes,
		m.hostFilesystemReadOnly,
		m.hostDiskInfo,
		m.hostDiskSize,
		m.hostDiskReadBytes,
		m.hostDiskWriteBytes,
		m.hostDiskReadIOPS,
		m.hostDiskWriteIOPS,
		m.hostDiskBusy,
		m.hostArraySize,
		m.hostArrayDisks,
		m.hostArraySync,
		m.hostBondInfo,
		m.hostBondSpeed,
		m.hostBondCarrier,
		m.hostBondSlaves,
		m.hostBondSlaveInfo,
		m.hostBondSlaveSpeed,
		m.hostBondSlaveCarrier,
		m.hostNetworkInfo,
		m.hostNetworkSpeed,
		m.hostNetworkCarrier,
		m.hostNetworkBytes,
		m.hostNetworkThroughput,
		m.hostNetworkPackets,
		m.hostNetworkErrors,
		m.hostNetworkDrops,
		m.hostGPUInfo,
		m.hostGPUBusy,
		m.hostGPUFrequency,
		m.hostGPUEngine,
		m.hostGPUStat,
		m.hostTemperature,
		m.hostFanSpeed,
		m.hostCoolingState,
		m.hostCoolingPercent,
		m.hostUPSInfo,
		m.hostUPSStatus,
		m.hostUPSOnline,
		m.hostUPSOnBattery,
		m.hostUPSLowBattery,
		m.hostUPSCharge,
		m.hostUPSRuntime,
		m.hostUPSVoltage,
		m.hostUPSLoad,
		m.hostUPSPower,
		m.hostUPSFrequency,
		m.hostUPSTemperature,
		m.hostProcessCount,
		m.hostProcessCPU,
		m.hostProcessMemory,
		m.hostProcessCPUTime,
		m.hostVMInfo,
		m.hostVMRunning,
		m.hostVMVCPUs,
		m.hostVMCPU,
		m.hostVMCPUTime,
		m.hostVMMemory,
		m.hostVMBlockBytes,
		m.hostVMNetworkBytes,
		m.up,
		m.lastCollection,
		m.statsErrors,
	)

	return m
}

func (m *Metrics) Update(snapshot model.Snapshot, err error) {
	m.lastCollection.Set(float64(time.Now().Unix()))
	m.containerCPU.Reset()
	m.containerMemory.Reset()
	m.containerMemoryLimit.Reset()
	m.containerRunning.Reset()
	m.containerStatsOK.Reset()
	m.containerCPUSeconds.Reset()
	m.containerCPUUserSeconds.Reset()
	m.containerCPUSystemSeconds.Reset()
	m.containerCPUCFSPeriods.Reset()
	m.containerCPUCFSThrottledPeriods.Reset()
	m.containerCPUCFSThrottledSeconds.Reset()
	m.containerSpecCPUQuota.Reset()
	m.containerSpecCPUPeriod.Reset()
	m.containerSpecCPUShares.Reset()
	m.containerMemoryRaw.Reset()
	m.containerMemoryWorkingSet.Reset()
	m.containerMemoryMaxUsage.Reset()
	m.containerMemoryRSS.Reset()
	m.containerMemoryCache.Reset()
	m.containerMemorySwap.Reset()
	m.containerMemoryFailCount.Reset()
	m.containerSpecMemoryLimit.Reset()
	m.containerSpecMemorySwapLimit.Reset()
	m.containerOOMKilled.Reset()
	m.containerOOMEvents.Reset()
	m.containerStartTime.Reset()
	m.containerHealth.Reset()
	m.containerPIDsCurrent.Reset()
	m.containerNetworkBytes.Reset()
	m.containerNetworkPackets.Reset()
	m.containerNetworkErrors.Reset()
	m.containerNetworkDrops.Reset()
	m.containerBlockIOBytes.Reset()
	m.containerBlockIOOperations.Reset()
	m.containerBlockIOTime.Reset()
	m.containerFilesystemSize.Reset()
	m.projectCPU.Reset()
	m.projectMemory.Reset()
	m.projectTotal.Reset()
	m.projectRunning.Reset()
	m.hostInfo.Reset()
	m.hostCPU.Reset()
	m.hostCPUCore.Reset()
	m.hostCPUFrequency.Reset()
	m.hostCPUGovernorInfo.Reset()
	m.hostLoad.Reset()
	m.hostUptime.Reset()
	m.hostContextSwitches.Reset()
	m.hostProcessesRunning.Reset()
	m.hostProcessesBlocked.Reset()
	m.hostMemory.Reset()
	m.hostFilesystemBytes.Reset()
	m.hostFilesystemInodes.Reset()
	m.hostFilesystemReadOnly.Reset()
	m.hostDiskInfo.Reset()
	m.hostDiskSize.Reset()
	m.hostDiskReadBytes.Reset()
	m.hostDiskWriteBytes.Reset()
	m.hostDiskReadIOPS.Reset()
	m.hostDiskWriteIOPS.Reset()
	m.hostDiskBusy.Reset()
	m.hostArraySize.Reset()
	m.hostArrayDisks.Reset()
	m.hostArraySync.Reset()
	m.hostBondInfo.Reset()
	m.hostBondSpeed.Reset()
	m.hostBondCarrier.Reset()
	m.hostBondSlaves.Reset()
	m.hostBondSlaveInfo.Reset()
	m.hostBondSlaveSpeed.Reset()
	m.hostBondSlaveCarrier.Reset()
	m.hostNetworkInfo.Reset()
	m.hostNetworkSpeed.Reset()
	m.hostNetworkCarrier.Reset()
	m.hostNetworkBytes.Reset()
	m.hostNetworkThroughput.Reset()
	m.hostNetworkPackets.Reset()
	m.hostNetworkErrors.Reset()
	m.hostNetworkDrops.Reset()
	m.hostGPUInfo.Reset()
	m.hostGPUBusy.Reset()
	m.hostGPUFrequency.Reset()
	m.hostGPUEngine.Reset()
	m.hostGPUStat.Reset()
	m.hostTemperature.Reset()
	m.hostFanSpeed.Reset()
	m.hostCoolingState.Reset()
	m.hostCoolingPercent.Reset()
	m.hostUPSInfo.Reset()
	m.hostUPSStatus.Reset()
	m.hostUPSOnline.Reset()
	m.hostUPSOnBattery.Reset()
	m.hostUPSLowBattery.Reset()
	m.hostUPSCharge.Reset()
	m.hostUPSRuntime.Reset()
	m.hostUPSVoltage.Reset()
	m.hostUPSLoad.Reset()
	m.hostUPSPower.Reset()
	m.hostUPSFrequency.Reset()
	m.hostUPSTemperature.Reset()
	m.hostProcessCount.Reset()
	m.hostProcessCPU.Reset()
	m.hostProcessMemory.Reset()
	m.hostProcessCPUTime.Reset()
	m.hostVMInfo.Reset()
	m.hostVMRunning.Reset()
	m.hostVMVCPUs.Reset()
	m.hostVMCPU.Reset()
	m.hostVMCPUTime.Reset()
	m.hostVMMemory.Reset()
	m.hostVMBlockBytes.Reset()
	m.hostVMNetworkBytes.Reset()

	if err != nil {
		m.up.Set(0)
		m.statsErrors.Set(0)
		return
	}

	m.up.Set(1)
	m.statsErrors.Set(float64(snapshot.ContainerStatsError))
	if !snapshot.CollectedAt.IsZero() {
		m.lastCollection.Set(float64(snapshot.CollectedAt.Unix()))
	}

	for _, container := range snapshot.Containers {
		labels := containerLabelValues(container)
		m.containerRunning.WithLabelValues(labels...).Set(boolToFloat(container.Running))
		m.containerStatsOK.WithLabelValues(labels...).Set(boolToFloat(container.StatsCollected))
		if container.StatsCollected {
			m.containerCPU.WithLabelValues(labels...).Set(container.CPUPercent)
			m.containerMemory.WithLabelValues(labels...).Set(float64(container.MemoryUsageBytes))
			m.containerMemoryLimit.WithLabelValues(labels...).Set(float64(container.MemoryLimitBytes))
		}
		if container.Detailed == nil {
			continue
		}

		detailed := container.Detailed
		m.containerCPUSeconds.WithLabelValues(labels...).Set(detailed.CPU.UsageSecondsTotal)
		m.containerCPUUserSeconds.WithLabelValues(labels...).Set(detailed.CPU.UserSecondsTotal)
		m.containerCPUSystemSeconds.WithLabelValues(labels...).Set(detailed.CPU.SystemSecondsTotal)
		m.containerCPUCFSPeriods.WithLabelValues(labels...).Set(float64(detailed.CPU.CFSPeriodsTotal))
		m.containerCPUCFSThrottledPeriods.WithLabelValues(labels...).Set(float64(detailed.CPU.CFSThrottledPeriodsTotal))
		m.containerCPUCFSThrottledSeconds.WithLabelValues(labels...).Set(detailed.CPU.CFSThrottledSecondsTotal)
		m.containerMemoryRaw.WithLabelValues(labels...).Set(float64(detailed.Memory.UsageBytes))
		m.containerMemoryWorkingSet.WithLabelValues(labels...).Set(float64(detailed.Memory.WorkingSetBytes))
		m.containerMemoryMaxUsage.WithLabelValues(labels...).Set(float64(detailed.Memory.MaxUsageBytes))
		m.containerMemoryRSS.WithLabelValues(labels...).Set(float64(detailed.Memory.RSSBytes))
		m.containerMemoryCache.WithLabelValues(labels...).Set(float64(detailed.Memory.CacheBytes))
		m.containerMemorySwap.WithLabelValues(labels...).Set(float64(detailed.Memory.SwapBytes))
		m.containerMemoryFailCount.WithLabelValues(labels...).Set(float64(detailed.Memory.FailCount))
		m.containerOOMEvents.WithLabelValues(labels...).Set(float64(detailed.OOMEvents))
		m.containerPIDsCurrent.WithLabelValues(labels...).Set(float64(detailed.PIDsCurrent))
		if detailed.InspectFound {
			m.containerSpecCPUQuota.WithLabelValues(labels...).Set(float64(detailed.CPU.QuotaMicroseconds))
			m.containerSpecCPUPeriod.WithLabelValues(labels...).Set(float64(detailed.CPU.PeriodMicroseconds))
			m.containerSpecCPUShares.WithLabelValues(labels...).Set(float64(detailed.CPU.Shares))
			m.containerSpecMemoryLimit.WithLabelValues(labels...).Set(float64(detailed.Memory.LimitBytes))
			m.containerSpecMemorySwapLimit.WithLabelValues(labels...).Set(float64(detailed.Memory.SwapLimitBytes))
			m.containerOOMKilled.WithLabelValues(labels...).Set(boolToFloat(detailed.OOMKilled))
			if !detailed.StartedAt.IsZero() {
				m.containerStartTime.WithLabelValues(labels...).Set(float64(detailed.StartedAt.Unix()))
			}
			if detailed.HealthStatus != "" {
				m.containerHealth.WithLabelValues(append(labels, detailed.HealthStatus)...).Set(1)
			}
		}

		for _, network := range detailed.Network.Interfaces {
			m.containerNetworkBytes.WithLabelValues(append(labels, network.Name, "receive")...).Set(float64(network.RxBytesTotal))
			m.containerNetworkBytes.WithLabelValues(append(labels, network.Name, "transmit")...).Set(float64(network.TxBytesTotal))
			m.containerNetworkPackets.WithLabelValues(append(labels, network.Name, "receive")...).Set(float64(network.RxPacketsTotal))
			m.containerNetworkPackets.WithLabelValues(append(labels, network.Name, "transmit")...).Set(float64(network.TxPacketsTotal))
			m.containerNetworkErrors.WithLabelValues(append(labels, network.Name, "receive")...).Set(float64(network.RxErrorsTotal))
			m.containerNetworkErrors.WithLabelValues(append(labels, network.Name, "transmit")...).Set(float64(network.TxErrorsTotal))
			m.containerNetworkDrops.WithLabelValues(append(labels, network.Name, "receive")...).Set(float64(network.RxDroppedTotal))
			m.containerNetworkDrops.WithLabelValues(append(labels, network.Name, "transmit")...).Set(float64(network.TxDroppedTotal))
		}

		m.containerBlockIOBytes.WithLabelValues(append(labels, "read")...).Set(float64(detailed.BlockIO.ReadBytesTotal))
		m.containerBlockIOBytes.WithLabelValues(append(labels, "write")...).Set(float64(detailed.BlockIO.WriteBytesTotal))
		m.containerBlockIOOperations.WithLabelValues(append(labels, "read")...).Set(float64(detailed.BlockIO.ReadOperationsTotal))
		m.containerBlockIOOperations.WithLabelValues(append(labels, "write")...).Set(float64(detailed.BlockIO.WriteOperationsTotal))
		m.containerBlockIOTime.WithLabelValues(append(labels, "io")...).Set(detailed.BlockIO.IOTimeSecondsTotal)
		m.containerBlockIOTime.WithLabelValues(append(labels, "wait")...).Set(detailed.BlockIO.WaitTimeSecondsTotal)
		m.containerBlockIOTime.WithLabelValues(append(labels, "service")...).Set(detailed.BlockIO.ServiceTimeSecondsTotal)

		if detailed.Filesystem.WritableLayerPresent {
			m.containerFilesystemSize.WithLabelValues(append(labels, "writable")...).Set(float64(detailed.Filesystem.WritableLayerBytes))
		}
		if detailed.Filesystem.RootFSPresent {
			m.containerFilesystemSize.WithLabelValues(append(labels, "rootfs")...).Set(float64(detailed.Filesystem.RootFSBytes))
		}
	}

	for _, project := range snapshot.Projects {
		labels := projectLabelValues(project)
		m.projectCPU.WithLabelValues(labels...).Set(project.CPUPercent)
		m.projectMemory.WithLabelValues(labels...).Set(float64(project.MemoryUsageBytes))
		m.projectTotal.WithLabelValues(labels...).Set(float64(project.TotalContainers))
		m.projectRunning.WithLabelValues(labels...).Set(float64(project.RunningContainers))
	}

	if snapshot.Host == nil {
		return
	}

	hostName := snapshot.Host.Name
	m.hostInfo.WithLabelValues(hostName).Set(1)
	m.hostCPU.WithLabelValues(hostName).Set(snapshot.Host.CPU.UsagePercent)
	m.hostUptime.WithLabelValues(hostName).Set(snapshot.Host.CPU.UptimeSeconds)
	m.hostContextSwitches.WithLabelValues(hostName).Set(float64(snapshot.Host.CPU.ContextSwitches))
	m.hostProcessesRunning.WithLabelValues(hostName).Set(float64(snapshot.Host.CPU.ProcessesRunning))
	m.hostProcessesBlocked.WithLabelValues(hostName).Set(float64(snapshot.Host.CPU.ProcessesBlocked))
	m.hostLoad.WithLabelValues(hostName, "1m").Set(snapshot.Host.CPU.Load1)
	m.hostLoad.WithLabelValues(hostName, "5m").Set(snapshot.Host.CPU.Load5)
	m.hostLoad.WithLabelValues(hostName, "15m").Set(snapshot.Host.CPU.Load15)

	for _, core := range snapshot.Host.CPU.CoreUsage {
		m.hostCPUCore.WithLabelValues(hostName, core.Name).Set(core.UsagePercent)
		if core.CurrentMHz > 0 {
			m.hostCPUFrequency.WithLabelValues(hostName, core.Name, "current").Set(core.CurrentMHz)
		}
		if core.MinMHz > 0 {
			m.hostCPUFrequency.WithLabelValues(hostName, core.Name, "min").Set(core.MinMHz)
		}
		if core.MaxMHz > 0 {
			m.hostCPUFrequency.WithLabelValues(hostName, core.Name, "max").Set(core.MaxMHz)
		}
		if core.Governor != "" {
			m.hostCPUGovernorInfo.WithLabelValues(hostName, core.Name, core.Governor).Set(1)
		}
	}

	m.hostMemory.WithLabelValues(hostName, "total").Set(float64(snapshot.Host.Memory.TotalBytes))
	m.hostMemory.WithLabelValues(hostName, "used").Set(float64(snapshot.Host.Memory.UsedBytes))
	m.hostMemory.WithLabelValues(hostName, "free").Set(float64(snapshot.Host.Memory.FreeBytes))
	m.hostMemory.WithLabelValues(hostName, "available").Set(float64(snapshot.Host.Memory.AvailableBytes))
	m.hostMemory.WithLabelValues(hostName, "cached").Set(float64(snapshot.Host.Memory.CachedBytes))
	m.hostMemory.WithLabelValues(hostName, "buffers").Set(float64(snapshot.Host.Memory.BuffersBytes))
	m.hostMemory.WithLabelValues(hostName, "swap_total").Set(float64(snapshot.Host.Memory.SwapTotalBytes))
	m.hostMemory.WithLabelValues(hostName, "swap_used").Set(float64(snapshot.Host.Memory.SwapUsedBytes))
	m.hostMemory.WithLabelValues(hostName, "swap_free").Set(float64(snapshot.Host.Memory.SwapFreeBytes))

	for _, fs := range snapshot.Host.Filesystems {
		labels := []string{hostName, fs.Name, fs.Name, fs.Source, fs.FSType, fs.Array}
		m.hostFilesystemBytes.WithLabelValues(append(labels, "total")...).Set(float64(fs.TotalBytes))
		m.hostFilesystemBytes.WithLabelValues(append(labels, "used")...).Set(float64(fs.UsedBytes))
		m.hostFilesystemBytes.WithLabelValues(append(labels, "free")...).Set(float64(fs.FreeBytes))
		m.hostFilesystemBytes.WithLabelValues(append(labels, "available")...).Set(float64(fs.AvailableBytes))
		m.hostFilesystemInodes.WithLabelValues(append(labels, "total")...).Set(float64(fs.FilesTotal))
		m.hostFilesystemInodes.WithLabelValues(append(labels, "used")...).Set(float64(fs.FilesUsed))
		m.hostFilesystemInodes.WithLabelValues(append(labels, "free")...).Set(float64(fs.FilesFree))
		m.hostFilesystemReadOnly.WithLabelValues(hostName, fs.Name, fs.Name, fs.Source, fs.FSType, fs.Array).Set(boolToFloat(fs.ReadOnly))
	}

	for _, disk := range snapshot.Host.Disks {
		labels := []string{hostName, disk.Name, disk.Type}
		m.hostDiskInfo.WithLabelValues(hostName, disk.Name, disk.Type, disk.Vendor, disk.Model, disk.Serial).Set(1)
		m.hostDiskSize.WithLabelValues(labels...).Set(float64(disk.SizeBytes))
		m.hostDiskReadBytes.WithLabelValues(labels...).Set(disk.ReadBytesPerSec)
		m.hostDiskWriteBytes.WithLabelValues(labels...).Set(disk.WriteBytesPerSec)
		m.hostDiskReadIOPS.WithLabelValues(labels...).Set(disk.ReadIOPS)
		m.hostDiskWriteIOPS.WithLabelValues(labels...).Set(disk.WriteIOPS)
		m.hostDiskBusy.WithLabelValues(labels...).Set(disk.BusyPercent)
	}

	for _, array := range snapshot.Host.Arrays {
		labels := []string{hostName, array.Name, array.Level, array.State}
		m.hostArraySize.WithLabelValues(labels...).Set(float64(array.SizeBytes))
		m.hostArrayDisks.WithLabelValues(append(labels, "total")...).Set(float64(array.DisksTotal))
		m.hostArrayDisks.WithLabelValues(append(labels, "active")...).Set(float64(array.DisksActive))
		m.hostArrayDisks.WithLabelValues(append(labels, "failed")...).Set(float64(array.DisksFailed))
		m.hostArrayDisks.WithLabelValues(append(labels, "spare")...).Set(float64(array.DisksSpare))
		m.hostArrayDisks.WithLabelValues(append(labels, "degraded")...).Set(float64(array.DegradedDisks))
		m.hostArraySync.WithLabelValues(hostName, array.Name, array.Level, array.State, array.SyncAction).Set(array.SyncCompletedPercent)
	}

	for _, bond := range snapshot.Host.Bonds {
		m.hostBondInfo.WithLabelValues(hostName, bond.Name, bond.Mode, bond.ActiveSlave, bond.Primary, bond.MIIStatus, bond.OperState).Set(1)
		m.hostBondSpeed.WithLabelValues(hostName, bond.Name).Set(float64(bond.SpeedMbps))
		m.hostBondCarrier.WithLabelValues(hostName, bond.Name).Set(boolToFloat(bond.Carrier))
		m.hostBondSlaves.WithLabelValues(hostName, bond.Name, "total").Set(float64(len(bond.Slaves)))
		activeCount := 0
		upCount := 0
		for _, slave := range bond.Slaves {
			if slave.Active {
				activeCount++
			}
			if slave.Carrier {
				upCount++
			}
			activeLabel := "0"
			if slave.Active {
				activeLabel = "1"
			}
			m.hostBondSlaveInfo.WithLabelValues(hostName, bond.Name, slave.Name, slave.MIIStatus, slave.OperState, slave.Duplex, activeLabel).Set(1)
			m.hostBondSlaveSpeed.WithLabelValues(hostName, bond.Name, slave.Name).Set(float64(slave.SpeedMbps))
			m.hostBondSlaveCarrier.WithLabelValues(hostName, bond.Name, slave.Name).Set(boolToFloat(slave.Carrier))
		}
		m.hostBondSlaves.WithLabelValues(hostName, bond.Name, "active").Set(float64(activeCount))
		m.hostBondSlaves.WithLabelValues(hostName, bond.Name, "up").Set(float64(upCount))
	}

	for _, network := range snapshot.Host.Networks {
		m.hostNetworkInfo.WithLabelValues(hostName, network.Name, network.MAC, network.OperState, network.Duplex).Set(1)
		m.hostNetworkSpeed.WithLabelValues(hostName, network.Name).Set(float64(network.SpeedMbps))
		m.hostNetworkCarrier.WithLabelValues(hostName, network.Name).Set(boolToFloat(network.Carrier))
		m.hostNetworkBytes.WithLabelValues(hostName, network.Name, "receive").Set(float64(network.RxBytesTotal))
		m.hostNetworkBytes.WithLabelValues(hostName, network.Name, "transmit").Set(float64(network.TxBytesTotal))
		m.hostNetworkThroughput.WithLabelValues(hostName, network.Name, "receive").Set(network.RxBytesPerSec)
		m.hostNetworkThroughput.WithLabelValues(hostName, network.Name, "transmit").Set(network.TxBytesPerSec)
		m.hostNetworkPackets.WithLabelValues(hostName, network.Name, "receive").Set(float64(network.RxPacketsTotal))
		m.hostNetworkPackets.WithLabelValues(hostName, network.Name, "transmit").Set(float64(network.TxPacketsTotal))
		m.hostNetworkErrors.WithLabelValues(hostName, network.Name, "receive").Set(float64(network.RxErrorsTotal))
		m.hostNetworkErrors.WithLabelValues(hostName, network.Name, "transmit").Set(float64(network.TxErrorsTotal))
		m.hostNetworkDrops.WithLabelValues(hostName, network.Name, "receive").Set(float64(network.RxDroppedTotal))
		m.hostNetworkDrops.WithLabelValues(hostName, network.Name, "transmit").Set(float64(network.TxDroppedTotal))
	}

	for _, gpu := range snapshot.Host.GPUs {
		m.hostGPUInfo.WithLabelValues(hostName, gpu.Name, gpu.Driver, gpu.Vendor, gpu.Device).Set(1)
		if gpu.BusyAvailable {
			m.hostGPUBusy.WithLabelValues(hostName, gpu.Name, gpu.Driver).Set(gpu.BusyPercent)
		}
		m.hostGPUFrequency.WithLabelValues(hostName, gpu.Name, gpu.Driver, "current").Set(float64(gpu.CurrentMHz))
		m.hostGPUFrequency.WithLabelValues(hostName, gpu.Name, gpu.Driver, "max").Set(float64(gpu.MaxMHz))
		m.hostGPUFrequency.WithLabelValues(hostName, gpu.Name, gpu.Driver, "boost").Set(float64(gpu.BoostMHz))
		if gpu.IntelTop != nil {
			m.hostGPUStat.WithLabelValues(hostName, gpu.Name, gpu.Driver, "frequency_actual_mhz").Set(gpu.IntelTop.ActualMHz)
			m.hostGPUStat.WithLabelValues(hostName, gpu.Name, gpu.Driver, "frequency_requested_mhz").Set(gpu.IntelTop.RequestedMHz)
			m.hostGPUStat.WithLabelValues(hostName, gpu.Name, gpu.Driver, "imc_bandwidth_reads_mib_per_second").Set(gpu.IntelTop.IMCReadsMiBPerSec)
			m.hostGPUStat.WithLabelValues(hostName, gpu.Name, gpu.Driver, "imc_bandwidth_writes_mib_per_second").Set(gpu.IntelTop.IMCWritesMiBPerSec)
			m.hostGPUStat.WithLabelValues(hostName, gpu.Name, gpu.Driver, "interrupts_per_second").Set(gpu.IntelTop.InterruptsPerSec)
			m.hostGPUStat.WithLabelValues(hostName, gpu.Name, gpu.Driver, "period_milliseconds").Set(gpu.IntelTop.PeriodMilliseconds)
			m.hostGPUStat.WithLabelValues(hostName, gpu.Name, gpu.Driver, "power_gpu_watts").Set(gpu.IntelTop.GPUPowerWatts)
			m.hostGPUStat.WithLabelValues(hostName, gpu.Name, gpu.Driver, "power_package_watts").Set(gpu.IntelTop.PackagePowerWatts)
			m.hostGPUStat.WithLabelValues(hostName, gpu.Name, gpu.Driver, "rc6_percent").Set(gpu.IntelTop.RC6Percent)
			for _, engine := range gpu.IntelTop.Engines {
				m.hostGPUEngine.WithLabelValues(hostName, gpu.Name, gpu.Driver, engine.Name, "busy").Set(engine.BusyPercent)
				m.hostGPUEngine.WithLabelValues(hostName, gpu.Name, gpu.Driver, engine.Name, "sema").Set(engine.SemaPercent)
				m.hostGPUEngine.WithLabelValues(hostName, gpu.Name, gpu.Driver, engine.Name, "wait").Set(engine.WaitPercent)
			}
		}
	}

	for _, sensor := range snapshot.Host.Sensors {
		labels := []string{hostName, sensor.Name, sensor.Chip, sensor.Label, sensor.Source, sensor.DeviceType, sensor.DeviceName}
		switch sensor.Kind {
		case "temperature":
			m.hostTemperature.WithLabelValues(labels...).Set(sensor.Value)
		case "fan":
			m.hostFanSpeed.WithLabelValues(labels...).Set(sensor.Value)
		}
	}

	for _, cooling := range snapshot.Host.Cooling {
		m.hostCoolingState.WithLabelValues(hostName, cooling.Name, cooling.Type, "current").Set(float64(cooling.CurState))
		m.hostCoolingState.WithLabelValues(hostName, cooling.Name, cooling.Type, "max").Set(float64(cooling.MaxState))
		if cooling.MaxState > 0 {
			m.hostCoolingPercent.WithLabelValues(hostName, cooling.Name, cooling.Type).Set(cooling.Percent)
		}
	}

	for _, ups := range snapshot.Host.UPSs {
		labels := []string{hostName, ups.Name}
		m.hostUPSInfo.WithLabelValues(hostName, ups.Name, ups.Manufacturer, ups.Model, ups.Serial).Set(1)
		if ups.Status != "" {
			m.hostUPSStatus.WithLabelValues(hostName, ups.Name, ups.Status).Set(1)
		}
		m.hostUPSOnline.WithLabelValues(labels...).Set(boolToFloat(ups.Online))
		m.hostUPSOnBattery.WithLabelValues(labels...).Set(boolToFloat(ups.OnBattery))
		m.hostUPSLowBattery.WithLabelValues(labels...).Set(boolToFloat(ups.LowBattery))
		if ups.BatteryChargeAvailable {
			m.hostUPSCharge.WithLabelValues(labels...).Set(ups.BatteryChargePercent)
		}
		if ups.BatteryRuntimeAvailable {
			m.hostUPSRuntime.WithLabelValues(labels...).Set(ups.BatteryRuntimeSeconds)
		}
		if ups.BatteryVoltageAvailable {
			m.hostUPSVoltage.WithLabelValues(append(labels, "battery")...).Set(ups.BatteryVoltage)
		}
		if ups.InputVoltageAvailable {
			m.hostUPSVoltage.WithLabelValues(append(labels, "input")...).Set(ups.InputVoltage)
		}
		if ups.OutputVoltageAvailable {
			m.hostUPSVoltage.WithLabelValues(append(labels, "output")...).Set(ups.OutputVoltage)
		}
		if ups.LoadPercentAvailable {
			m.hostUPSLoad.WithLabelValues(labels...).Set(ups.LoadPercent)
		}
		if ups.RealPowerWattsAvailable {
			m.hostUPSPower.WithLabelValues(append(labels, "real")...).Set(ups.RealPowerWatts)
		}
		if ups.NominalRealPowerWattsAvailable {
			m.hostUPSPower.WithLabelValues(append(labels, "nominal_real")...).Set(ups.NominalRealPowerWatts)
		}
		if ups.LineFrequencyHzAvailable {
			m.hostUPSFrequency.WithLabelValues(labels...).Set(ups.LineFrequencyHz)
		}
		if ups.TemperatureCelsiusAvailable {
			m.hostUPSTemperature.WithLabelValues(labels...).Set(ups.TemperatureCelsius)
		}
	}

	processes := snapshot.Host.Processes
	if len(processes) > 10 {
		processes = processes[:10]
	}
	for _, process := range processes {
		labels := []string{hostName, process.Name}
		m.hostProcessCount.WithLabelValues(labels...).Set(float64(process.ProcessCount))
		m.hostProcessCPU.WithLabelValues(labels...).Set(process.CPUPercent)
		m.hostProcessMemory.WithLabelValues(labels...).Set(float64(process.MemoryBytes))
		m.hostProcessCPUTime.WithLabelValues(labels...).Set(process.CPUTimeSeconds)
	}

	for _, vm := range snapshot.Host.VMs {
		labels := []string{hostName, vm.UGOSVMID, vm.Name}
		m.hostVMInfo.WithLabelValues(hostName, vm.UGOSVMID, vm.Name, vm.SourceName, vm.State, vm.ISOPath).Set(1)
		m.hostVMRunning.WithLabelValues(labels...).Set(boolToFloat(vm.Running))
		m.hostVMVCPUs.WithLabelValues(labels...).Set(float64(vm.VCPUs))
		m.hostVMCPU.WithLabelValues(labels...).Set(vm.CPUPercent)
		m.hostVMCPUTime.WithLabelValues(labels...).Set(vm.CPUTimeSeconds)
		m.hostVMMemory.WithLabelValues(append(labels, "used")...).Set(float64(vmMemoryUsageBytes(vm)))
		m.hostVMMemory.WithLabelValues(append(labels, "current")...).Set(float64(vm.MemoryBytes))
		m.hostVMMemory.WithLabelValues(append(labels, "maximum")...).Set(float64(vm.MaxMemoryBytes))
		m.hostVMMemory.WithLabelValues(append(labels, "available")...).Set(float64(vm.MemoryAvailBytes))
		m.hostVMMemory.WithLabelValues(append(labels, "unused")...).Set(float64(vm.MemoryUnusedBytes))
		m.hostVMMemory.WithLabelValues(append(labels, "rss")...).Set(float64(vm.MemoryRSSBytes))
		m.hostVMBlockBytes.WithLabelValues(append(labels, "read")...).Set(float64(vm.DiskReadBytes))
		m.hostVMBlockBytes.WithLabelValues(append(labels, "write")...).Set(float64(vm.DiskWriteBytes))
		m.hostVMNetworkBytes.WithLabelValues(append(labels, "receive")...).Set(float64(vm.NetworkRxBytes))
		m.hostVMNetworkBytes.WithLabelValues(append(labels, "transmit")...).Set(float64(vm.NetworkTxBytes))
	}
}

func projectLabelValues(project model.ProjectSnapshot) []string {
	return []string{
		project.Name,
		strconv.Itoa(project.RunningContainers),
		strconv.Itoa(project.TotalContainers),
	}
}

func containerLabelValues(container model.ContainerSnapshot) []string {
	return []string{container.ID, container.Name, container.Project, container.Image, container.State}
}

func vmMemoryUsageBytes(vm model.VirtualMachineSnapshot) uint64 {
	if !vm.Running {
		return 0
	}
	if vm.MemoryUsageBytes > 0 {
		return vm.MemoryUsageBytes
	}
	return vm.MemoryBytes
}

func boolToFloat(value bool) float64 {
	if value {
		return 1
	}
	return 0
}
