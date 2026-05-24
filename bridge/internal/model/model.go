package model

import "time"

type Snapshot struct {
	CollectedAt         time.Time
	Containers          []ContainerSnapshot
	Projects            []ProjectSnapshot
	Host                *HostSnapshot
	ContainerStatsError int
}

type ContainerSnapshot struct {
	ID               string
	Name             string
	Project          string
	Image            string
	State            string
	Status           string
	CPUPercent       float64
	MemoryUsageBytes uint64
	MemoryLimitBytes uint64
	Running          bool
	StatsCollected   bool
	Detailed         *ContainerDetailedSnapshot
}

type ContainerDetailedSnapshot struct {
	StatsRead    time.Time
	StartedAt    time.Time
	CPU          ContainerCPUSnapshot
	Memory       ContainerMemoryDetailedSnapshot
	Network      ContainerNetworkDetailedSnapshot
	BlockIO      ContainerBlockIOSnapshot
	Filesystem   ContainerFilesystemSnapshot
	PIDsCurrent  uint64
	OOMEvents    uint64
	OOMKilled    bool
	HealthStatus string
	InspectFound bool
}

type ContainerCPUSnapshot struct {
	UsageSecondsTotal        float64
	UserSecondsTotal         float64
	SystemSecondsTotal       float64
	CFSPeriodsTotal          uint64
	CFSThrottledPeriodsTotal uint64
	CFSThrottledSecondsTotal float64
	QuotaMicroseconds        int64
	PeriodMicroseconds       int64
	Shares                   int64
}

type ContainerMemoryDetailedSnapshot struct {
	UsageBytes      uint64
	WorkingSetBytes uint64
	LimitBytes      uint64
	SwapLimitBytes  uint64
	MaxUsageBytes   uint64
	RSSBytes        uint64
	CacheBytes      uint64
	SwapBytes       uint64
	FailCount       uint64
}

type ContainerNetworkDetailedSnapshot struct {
	Interfaces []ContainerNetworkInterfaceSnapshot
}

type ContainerNetworkInterfaceSnapshot struct {
	Name           string
	RxBytesTotal   uint64
	TxBytesTotal   uint64
	RxPacketsTotal uint64
	TxPacketsTotal uint64
	RxErrorsTotal  uint64
	TxErrorsTotal  uint64
	RxDroppedTotal uint64
	TxDroppedTotal uint64
}

type ContainerBlockIOSnapshot struct {
	ReadBytesTotal          uint64
	WriteBytesTotal         uint64
	ReadOperationsTotal     uint64
	WriteOperationsTotal    uint64
	IOTimeSecondsTotal      float64
	WaitTimeSecondsTotal    float64
	ServiceTimeSecondsTotal float64
}

type ContainerFilesystemSnapshot struct {
	WritableLayerBytes   uint64
	WritableLayerPresent bool
	RootFSBytes          uint64
	RootFSPresent        bool
}

type ProjectSnapshot struct {
	Name              string
	CPUPercent        float64
	MemoryUsageBytes  uint64
	TotalContainers   int
	RunningContainers int
}

type HostSnapshot struct {
	Name        string
	CPU         HostCPUSnapshot
	Memory      HostMemorySnapshot
	Filesystems []FilesystemSnapshot
	Disks       []DiskSnapshot
	Arrays      []ArraySnapshot
	Networks    []NetworkSnapshot
	Bonds       []BondSnapshot
	GPUs        []GPUSnapshot
	Sensors     []SensorSnapshot
	Cooling     []CoolingDeviceSnapshot
	UPSs        []UPSSnapshot
	Processes   []ProcessSnapshot
	VMs         []VirtualMachineSnapshot
}

type HostCPUSnapshot struct {
	Cores            int
	UsagePercent     float64
	CurrentMHz       float64
	Load1            float64
	Load5            float64
	Load15           float64
	UptimeSeconds    float64
	ContextSwitches  uint64
	ProcessesRunning uint64
	ProcessesBlocked uint64
	CoreUsage        []CPUCoreSnapshot
}

type CPUCoreSnapshot struct {
	Name         string
	UsagePercent float64
	CurrentMHz   float64
	MinMHz       float64
	MaxMHz       float64
	Governor     string
}

type HostMemorySnapshot struct {
	TotalBytes     uint64
	UsedBytes      uint64
	FreeBytes      uint64
	AvailableBytes uint64
	CachedBytes    uint64
	BuffersBytes   uint64
	SwapTotalBytes uint64
	SwapUsedBytes  uint64
	SwapFreeBytes  uint64
}

type FilesystemSnapshot struct {
	Name           string
	Path           string
	Source         string
	FSType         string
	Array          string
	TotalBytes     uint64
	UsedBytes      uint64
	FreeBytes      uint64
	AvailableBytes uint64
	FilesTotal     uint64
	FilesUsed      uint64
	FilesFree      uint64
	ReadOnly       bool
}

type DiskSnapshot struct {
	Name             string
	Model            string
	Vendor           string
	Serial           string
	Type             string
	SizeBytes        uint64
	Rotational       bool
	ReadBytesTotal   uint64
	WriteBytesTotal  uint64
	ReadIOsTotal     uint64
	WriteIOsTotal    uint64
	ReadBytesPerSec  float64
	WriteBytesPerSec float64
	ReadIOPS         float64
	WriteIOPS        float64
	BusyPercent      float64
}

type ArraySnapshot struct {
	Name                 string
	Level                string
	State                string
	SizeBytes            uint64
	DisksTotal           uint64
	DisksActive          uint64
	DisksFailed          uint64
	DisksSpare           uint64
	DegradedDisks        uint64
	SyncAction           string
	SyncCompletedPercent float64
	Members              []string
	Mountpoints          []string
}

type NetworkSnapshot struct {
	Name           string
	Master         string
	MAC            string
	OperState      string
	Duplex         string
	SpeedMbps      int64
	MTU            int64
	Carrier        bool
	RxBytesTotal   uint64
	TxBytesTotal   uint64
	RxPacketsTotal uint64
	TxPacketsTotal uint64
	RxErrorsTotal  uint64
	TxErrorsTotal  uint64
	RxDroppedTotal uint64
	TxDroppedTotal uint64
	RxBytesPerSec  float64
	TxBytesPerSec  float64
}

type BondSnapshot struct {
	Name        string
	Mode        string
	ActiveSlave string
	Primary     string
	MIIStatus   string
	OperState   string
	SpeedMbps   int64
	Carrier     bool
	Slaves      []BondSlaveSnapshot
}

type BondSlaveSnapshot struct {
	Name      string
	MIIStatus string
	OperState string
	Duplex    string
	SpeedMbps int64
	Carrier   bool
	Active    bool
}

type GPUSnapshot struct {
	Name          string
	Driver        string
	Vendor        string
	Device        string
	CardPath      string
	BusyPercent   float64
	BusyAvailable bool
	CurrentMHz    uint64
	MaxMHz        uint64
	BoostMHz      uint64
	IntelTop      *IntelGPUSnapshot
}

type IntelGPUSnapshot struct {
	ActualMHz          float64
	RequestedMHz       float64
	IMCReadsMiBPerSec  float64
	IMCWritesMiBPerSec float64
	InterruptsPerSec   float64
	PeriodMilliseconds float64
	GPUPowerWatts      float64
	PackagePowerWatts  float64
	RC6Percent         float64
	Engines            []GPUEngineSnapshot
}

type GPUEngineSnapshot struct {
	Name        string
	BusyPercent float64
	SemaPercent float64
	WaitPercent float64
}

type SensorSnapshot struct {
	Name       string
	Label      string
	Chip       string
	Source     string
	Kind       string
	Value      float64
	DeviceType string
	DeviceName string
}

type CoolingDeviceSnapshot struct {
	Name     string
	Type     string
	CurState int64
	MaxState int64
	Percent  float64
}

type UPSSnapshot struct {
	Name                           string  `json:"name"`
	Model                          string  `json:"model"`
	Manufacturer                   string  `json:"manufacturer"`
	Serial                         string  `json:"serial"`
	Status                         string  `json:"status"`
	Online                         bool    `json:"online"`
	OnBattery                      bool    `json:"on_battery"`
	LowBattery                     bool    `json:"low_battery"`
	BatteryChargePercent           float64 `json:"battery_charge_percent"`
	BatteryRuntimeSeconds          float64 `json:"battery_runtime_seconds"`
	BatteryVoltage                 float64 `json:"battery_voltage"`
	InputVoltage                   float64 `json:"input_voltage"`
	OutputVoltage                  float64 `json:"output_voltage"`
	LoadPercent                    float64 `json:"load_percent"`
	RealPowerWatts                 float64 `json:"real_power_watts"`
	NominalRealPowerWatts          float64 `json:"nominal_real_power_watts"`
	LineFrequencyHz                float64 `json:"line_frequency_hz"`
	TemperatureCelsius             float64 `json:"temperature_celsius"`
	BatteryChargeAvailable         bool    `json:"battery_charge_available"`
	BatteryRuntimeAvailable        bool    `json:"battery_runtime_available"`
	BatteryVoltageAvailable        bool    `json:"battery_voltage_available"`
	InputVoltageAvailable          bool    `json:"input_voltage_available"`
	OutputVoltageAvailable         bool    `json:"output_voltage_available"`
	LoadPercentAvailable           bool    `json:"load_percent_available"`
	RealPowerWattsAvailable        bool    `json:"real_power_watts_available"`
	NominalRealPowerWattsAvailable bool    `json:"nominal_real_power_watts_available"`
	LineFrequencyHzAvailable       bool    `json:"line_frequency_hz_available"`
	TemperatureCelsiusAvailable    bool    `json:"temperature_celsius_available"`
}

type ProcessSnapshot struct {
	Name           string  `json:"name"`
	ProcessCount   int     `json:"process_count"`
	CPUPercent     float64 `json:"cpu_percent"`
	MemoryBytes    uint64  `json:"memory_bytes"`
	CPUTimeSeconds float64 `json:"cpu_time_seconds"`
}

type VirtualMachineSnapshot struct {
	UGOSVMID          string   `json:"ugos_vm_id"`
	Name              string   `json:"name"`
	SourceName        string   `json:"source_name"`
	State             string   `json:"state"`
	Running           bool     `json:"running"`
	VCPUs             uint64   `json:"vcpus"`
	CPUPercent        float64  `json:"cpu_percent"`
	CPUTimeSeconds    float64  `json:"cpu_time_seconds"`
	MemoryBytes       uint64   `json:"memory_bytes"`
	MemoryUsageBytes  uint64   `json:"memory_usage_bytes"`
	MemoryUnusedBytes uint64   `json:"memory_unused_bytes"`
	MemoryAvailBytes  uint64   `json:"memory_available_bytes"`
	MemoryRSSBytes    uint64   `json:"memory_rss_bytes"`
	MaxMemoryBytes    uint64   `json:"max_memory_bytes"`
	DiskReadBytes     uint64   `json:"disk_read_bytes"`
	DiskWriteBytes    uint64   `json:"disk_write_bytes"`
	NetworkRxBytes    uint64   `json:"network_rx_bytes"`
	NetworkTxBytes    uint64   `json:"network_tx_bytes"`
	ISOPath           string   `json:"iso_path"`
	DiskPaths         []string `json:"disk_paths"`
	DefinitionPresent bool     `json:"definition_present"`
}
