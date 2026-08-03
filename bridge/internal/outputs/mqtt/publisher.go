package mqttoutput

import (
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"sort"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/rs/zerolog"

	"github.com/RCooLeR/UgosBridge/bridge/internal/model"
)

var nonAlphaNum = regexp.MustCompile(`[^a-z0-9]+`)

var ErrNotConnected = errors.New("mqtt broker is not connected")

const (
	defaultUnavailableAfter = 3
	defaultRemoveAfter      = 30
	defaultTopProcessLimit  = 10
)

type MQTTConfig struct {
	Broker           string
	ClientID         string
	Username         string
	Password         string
	TopicPrefix      string
	DiscoveryPrefix  string
	QoS              byte
	Retain           bool
	ConnectTimeout   time.Duration
	ProcessAllowlist []string
	UnavailableAfter int
	RemoveAfter      int
	Log              zerolog.Logger
}

type MQTTPublisher struct {
	client             mqtt.Client
	cfg                MQTTConfig
	log                zerolog.Logger
	availabilityTopic  string
	availabilityOnline string
	mu                 sync.Mutex
	replayPending      atomic.Bool
	discoveredEntities map[string]publishedEntity
	lastPayloads       map[string]string
	preparedPayloads   map[string]preparedPayload
}

type publishedEntity struct {
	discoveryTopic    string
	stateTopic        string
	availabilityTopic string
	missingPolls      int
}

type preparedPayload struct {
	values          map[string]any
	attributes      map[string]any
	attributesTopic string
}

type sensorDefinition struct {
	NameSuffix     string
	ObjectID       string
	ValueKey       string
	Unit           string
	Icon           string
	DeviceClass    string
	StateClass     string
	EntityCategory string
	Attributes     bool
}

type binarySensorDefinition struct {
	NameSuffix     string
	ObjectID       string
	ValueKey       string
	PayloadOn      string
	PayloadOff     string
	DeviceClass    string
	Icon           string
	EntityCategory string
}

type deviceDescriptor struct {
	ID           string
	EntityID     string
	Name         string
	ViaDeviceID  string
	Manufacturer string
	Model        string
}

var projectSensors = map[string]sensorDefinition{
	"cpu":     {NameSuffix: "CPU", ObjectID: "cpu_usage_percent", ValueKey: "cpu_usage_percent", Unit: "%", Icon: "mdi:cpu-64-bit", StateClass: "measurement", Attributes: true},
	"memory":  {NameSuffix: "Memory", ObjectID: "memory_usage_bytes", ValueKey: "memory_usage_bytes", Unit: "B", Icon: "mdi:memory", DeviceClass: "data_size", StateClass: "measurement"},
	"total":   {NameSuffix: "Total Containers", ObjectID: "total_containers", ValueKey: "total_containers", Icon: "mdi:docker", StateClass: "measurement"},
	"running": {NameSuffix: "Running Containers", ObjectID: "running_containers", ValueKey: "running_containers", Icon: "mdi:play-circle", StateClass: "measurement"},
}

var containerSensors = map[string]sensorDefinition{
	"cpu":     {NameSuffix: "CPU", ObjectID: "cpu_usage_percent", ValueKey: "cpu_usage_percent", Unit: "%", Icon: "mdi:cpu-64-bit", StateClass: "measurement", Attributes: true},
	"memory":  {NameSuffix: "Memory", ObjectID: "memory_usage_bytes", ValueKey: "memory_usage_bytes", Unit: "B", Icon: "mdi:memory", DeviceClass: "data_size", StateClass: "measurement"},
	"running": {NameSuffix: "Running", ObjectID: "running", ValueKey: "running", Icon: "mdi:play-circle", StateClass: "measurement"},
}

var vmSensors = map[string]sensorDefinition{
	"cpu":            {NameSuffix: "CPU", ObjectID: "cpu_usage_percent", ValueKey: "cpu_usage_percent", Unit: "%", Icon: "mdi:cpu-64-bit", StateClass: "measurement", Attributes: true},
	"memory":         {NameSuffix: "Memory Used", ObjectID: "memory_usage_bytes", ValueKey: "memory_usage_bytes", Unit: "B", Icon: "mdi:memory", DeviceClass: "data_size", StateClass: "measurement"},
	"memory_current": {NameSuffix: "Memory Current", ObjectID: "memory_current_bytes", ValueKey: "memory_current_bytes", Unit: "B", Icon: "mdi:memory", DeviceClass: "data_size", StateClass: "measurement"},
	"running":        {NameSuffix: "Running", ObjectID: "running", ValueKey: "running", Icon: "mdi:play-circle", StateClass: "measurement"},
	"vcpus":          {NameSuffix: "vCPUs", ObjectID: "vcpus", ValueKey: "vcpus", Icon: "mdi:chip", StateClass: "measurement"},
	"disk_read":      {NameSuffix: "Disk Read", ObjectID: "disk_read_bytes", ValueKey: "disk_read_bytes", Unit: "B", Icon: "mdi:download", DeviceClass: "data_size", StateClass: "total_increasing"},
	"disk_write":     {NameSuffix: "Disk Write", ObjectID: "disk_write_bytes", ValueKey: "disk_write_bytes", Unit: "B", Icon: "mdi:upload", DeviceClass: "data_size", StateClass: "total_increasing"},
}

var hostSensors = map[string]sensorDefinition{
	"cpu":       {NameSuffix: "CPU", ObjectID: "cpu_usage_percent", ValueKey: "cpu_usage_percent", Unit: "%", Icon: "mdi:cpu-64-bit", StateClass: "measurement", Attributes: true},
	"cpufreq":   {NameSuffix: "CPU Frequency", ObjectID: "cpu_frequency_mhz", ValueKey: "cpu_frequency_mhz", Unit: "MHz", Icon: "mdi:sine-wave", StateClass: "measurement"},
	"load1":     {NameSuffix: "Load 1m", ObjectID: "load_1", ValueKey: "load_1", Unit: "%", Icon: "mdi:gauge", StateClass: "measurement"},
	"memory":    {NameSuffix: "Memory Used", ObjectID: "memory_used_bytes", ValueKey: "memory_used_bytes", Unit: "B", Icon: "mdi:memory", DeviceClass: "data_size", StateClass: "measurement", Attributes: true},
	"memorypct": {NameSuffix: "Memory Used", ObjectID: "memory_used_percent", ValueKey: "memory_used_percent", Unit: "%", Icon: "mdi:memory", StateClass: "measurement"},
	"swappct":   {NameSuffix: "Swap Used", ObjectID: "swap_used_percent", ValueKey: "swap_used_percent", Unit: "%", Icon: "mdi:swap-horizontal", StateClass: "measurement"},
	"uptime":    {NameSuffix: "Uptime", ObjectID: "uptime_seconds", ValueKey: "uptime_seconds", Unit: "s", Icon: "mdi:clock-outline", DeviceClass: "duration", StateClass: "measurement"},
}

var processSensors = map[string]sensorDefinition{
	"count":    {NameSuffix: "Process Count", ObjectID: "process_count", ValueKey: "process_count", Icon: "mdi:counter", StateClass: "measurement"},
	"cpu":      {NameSuffix: "CPU", ObjectID: "cpu_usage_percent", ValueKey: "cpu_usage_percent", Unit: "%", Icon: "mdi:cpu-64-bit", StateClass: "measurement", Attributes: true},
	"memory":   {NameSuffix: "Memory", ObjectID: "memory_usage_bytes", ValueKey: "memory_usage_bytes", Unit: "B", Icon: "mdi:memory", DeviceClass: "data_size", StateClass: "measurement"},
	"cpu_time": {NameSuffix: "CPU Time", ObjectID: "cpu_time_seconds", ValueKey: "cpu_time_seconds", Unit: "s", Icon: "mdi:timer-outline", StateClass: "measurement"},
}

var filesystemSensors = map[string]sensorDefinition{
	"used":     {NameSuffix: "Used", ObjectID: "used_bytes", ValueKey: "used_bytes", Unit: "B", Icon: "mdi:harddisk", DeviceClass: "data_size", StateClass: "measurement", Attributes: true},
	"free":     {NameSuffix: "Free", ObjectID: "free_bytes", ValueKey: "free_bytes", Unit: "B", Icon: "mdi:harddisk", DeviceClass: "data_size", StateClass: "measurement"},
	"used_pct": {NameSuffix: "Used", ObjectID: "used_percent", ValueKey: "used_percent", Unit: "%", Icon: "mdi:chart-donut", StateClass: "measurement"},
}

var diskSensors = map[string]sensorDefinition{
	"read_bps":  {NameSuffix: "Read Throughput", ObjectID: "read_bytes_per_second", ValueKey: "read_bytes_per_second", Unit: "B/s", Icon: "mdi:download", DeviceClass: "data_rate", StateClass: "measurement"},
	"write_bps": {NameSuffix: "Write Throughput", ObjectID: "write_bytes_per_second", ValueKey: "write_bytes_per_second", Unit: "B/s", Icon: "mdi:upload", DeviceClass: "data_rate", StateClass: "measurement"},
	"busy":      {NameSuffix: "Busy", ObjectID: "busy_percent", ValueKey: "busy_percent", Unit: "%", Icon: "mdi:harddisk", StateClass: "measurement"},
	"size":      {NameSuffix: "Size", ObjectID: "size_bytes", ValueKey: "size_bytes", Unit: "B", Icon: "mdi:database", DeviceClass: "data_size", StateClass: "measurement", Attributes: true},
	"model":     {NameSuffix: "Model", ObjectID: "model", ValueKey: "model", Icon: "mdi:information-outline"},
	"vendor":    {NameSuffix: "Vendor", ObjectID: "vendor", ValueKey: "vendor", Icon: "mdi:factory"},
	"serial":    {NameSuffix: "Serial", ObjectID: "serial", ValueKey: "serial", Icon: "mdi:barcode"},
	"type":      {NameSuffix: "Media", ObjectID: "media_type", ValueKey: "type", Icon: "mdi:harddisk-plus"},
}

var networkSensors = map[string]sensorDefinition{
	"rx_bps":  {NameSuffix: "RX Throughput", ObjectID: "rx_bytes_per_second", ValueKey: "rx_bytes_per_second", Unit: "B/s", Icon: "mdi:download-network", DeviceClass: "data_rate", StateClass: "measurement", Attributes: true},
	"tx_bps":  {NameSuffix: "TX Throughput", ObjectID: "tx_bytes_per_second", ValueKey: "tx_bytes_per_second", Unit: "B/s", Icon: "mdi:upload-network", DeviceClass: "data_rate", StateClass: "measurement"},
	"speed":   {NameSuffix: "Link Speed", ObjectID: "speed_mbps", ValueKey: "speed_mbps", Unit: "Mbit/s", Icon: "mdi:speedometer", StateClass: "measurement"},
	"carrier": {NameSuffix: "Carrier", ObjectID: "carrier", ValueKey: "carrier", Icon: "mdi:lan-connect", StateClass: "measurement"},
}

var bondSensors = map[string]sensorDefinition{
	"speed":        {NameSuffix: "Link Speed", ObjectID: "speed_mbps", ValueKey: "speed_mbps", Unit: "Mbit/s", Icon: "mdi:speedometer", StateClass: "measurement", Attributes: true},
	"mode":         {NameSuffix: "Mode", ObjectID: "mode", ValueKey: "mode", Icon: "mdi:call-split"},
	"active_slave": {NameSuffix: "Active Slave", ObjectID: "active_slave", ValueKey: "active_slave", Icon: "mdi:transit-connection-variant"},
	"mii_status":   {NameSuffix: "MII Status", ObjectID: "mii_status", ValueKey: "mii_status", Icon: "mdi:lan"},
	"slave_count":  {NameSuffix: "Slave Count", ObjectID: "slave_count", ValueKey: "slave_count", Icon: "mdi:lan-pending", StateClass: "measurement"},
}

var bondSlaveSensors = map[string]sensorDefinition{
	"speed":      {NameSuffix: "Link Speed", ObjectID: "speed_mbps", ValueKey: "speed_mbps", Unit: "Mbit/s", Icon: "mdi:speedometer", StateClass: "measurement", Attributes: true},
	"mii_status": {NameSuffix: "MII Status", ObjectID: "mii_status", ValueKey: "mii_status", Icon: "mdi:lan"},
}

var arraySensors = map[string]sensorDefinition{
	"degraded": {NameSuffix: "Degraded Disks", ObjectID: "degraded_disks", ValueKey: "degraded_disks", Icon: "mdi:alert", StateClass: "measurement"},
	"active":   {NameSuffix: "Active Disks", ObjectID: "active_disks", ValueKey: "active_disks", Icon: "mdi:harddisk", StateClass: "measurement"},
	"total":    {NameSuffix: "Total Disks", ObjectID: "total_disks", ValueKey: "total_disks", Icon: "mdi:harddisk-plus", StateClass: "measurement"},
	"sync":     {NameSuffix: "Sync Progress", ObjectID: "sync_completed_percent", ValueKey: "sync_completed_percent", Unit: "%", Icon: "mdi:progress-clock", StateClass: "measurement"},
	"size":     {NameSuffix: "Size", ObjectID: "size_bytes", ValueKey: "size_bytes", Unit: "B", Icon: "mdi:database", DeviceClass: "data_size", StateClass: "measurement", Attributes: true},
	"level":    {NameSuffix: "Level", ObjectID: "level", ValueKey: "level", Icon: "mdi:layers-triple-outline"},
}

var gpuSensors = map[string]sensorDefinition{
	"busy":    {NameSuffix: "Busy", ObjectID: "busy_percent", ValueKey: "busy_percent", Unit: "%", Icon: "mdi:gpu", StateClass: "measurement"},
	"current": {NameSuffix: "Current Frequency", ObjectID: "current_mhz", ValueKey: "current_mhz", Unit: "MHz", Icon: "mdi:sine-wave", StateClass: "measurement", Attributes: true},
	"max":     {NameSuffix: "Max Frequency", ObjectID: "max_mhz", ValueKey: "max_mhz", Unit: "MHz", Icon: "mdi:sine-wave", StateClass: "measurement"},
}

var healthSensors = map[string]sensorDefinition{
	"temperature": {NameSuffix: "Temperature", ObjectID: "temperature_celsius", ValueKey: "temperature_celsius", Unit: "°C", DeviceClass: "temperature", StateClass: "measurement", Attributes: true},
	"fan":         {NameSuffix: "Fan Speed", ObjectID: "fan_speed_rpm", ValueKey: "fan_speed_rpm", Unit: "rpm", Icon: "mdi:fan", StateClass: "measurement", Attributes: true},
}

var coolingSensors = map[string]sensorDefinition{
	"percent": {NameSuffix: "Cooling Level", ObjectID: "cooling_percent", ValueKey: "cooling_percent", Unit: "%", Icon: "mdi:fan-chevron-up", StateClass: "measurement"},
	"state":   {NameSuffix: "Cooling State", ObjectID: "cooling_state", ValueKey: "cooling_state", Icon: "mdi:fan", StateClass: "measurement", Attributes: true},
	"max":     {NameSuffix: "Cooling Max State", ObjectID: "cooling_max_state", ValueKey: "cooling_max_state", Icon: "mdi:fan", StateClass: "measurement"},
}

var upsSensors = map[string]sensorDefinition{
	"status":        {NameSuffix: "Status", ObjectID: "status", ValueKey: "status", Icon: "mdi:power-plug-battery", Attributes: true},
	"charge":        {NameSuffix: "Battery Charge", ObjectID: "battery_charge_percent", ValueKey: "battery_charge_percent", Unit: "%", Icon: "mdi:battery", DeviceClass: "battery", StateClass: "measurement"},
	"runtime":       {NameSuffix: "Battery Runtime", ObjectID: "battery_runtime_seconds", ValueKey: "battery_runtime_seconds", Unit: "s", Icon: "mdi:timer-outline", DeviceClass: "duration", StateClass: "measurement"},
	"battery_volt":  {NameSuffix: "Battery Voltage", ObjectID: "battery_voltage", ValueKey: "battery_voltage", Unit: "V", Icon: "mdi:sine-wave", DeviceClass: "voltage", StateClass: "measurement"},
	"input_volt":    {NameSuffix: "Input Voltage", ObjectID: "input_voltage", ValueKey: "input_voltage", Unit: "V", Icon: "mdi:transmission-tower-import", DeviceClass: "voltage", StateClass: "measurement"},
	"output_volt":   {NameSuffix: "Output Voltage", ObjectID: "output_voltage", ValueKey: "output_voltage", Unit: "V", Icon: "mdi:transmission-tower-export", DeviceClass: "voltage", StateClass: "measurement"},
	"load":          {NameSuffix: "Load", ObjectID: "load_percent", ValueKey: "load_percent", Unit: "%", Icon: "mdi:gauge", StateClass: "measurement"},
	"power":         {NameSuffix: "Real Power", ObjectID: "real_power_watts", ValueKey: "real_power_watts", Unit: "W", Icon: "mdi:flash", DeviceClass: "power", StateClass: "measurement"},
	"nominal_power": {NameSuffix: "Nominal Real Power", ObjectID: "nominal_real_power_watts", ValueKey: "nominal_real_power_watts", Unit: "W", Icon: "mdi:flash-outline", DeviceClass: "power", StateClass: "measurement"},
	"frequency":     {NameSuffix: "Line Frequency", ObjectID: "line_frequency_hz", ValueKey: "line_frequency_hz", Unit: "Hz", Icon: "mdi:sine-wave", DeviceClass: "frequency", StateClass: "measurement"},
	"temperature":   {NameSuffix: "Temperature", ObjectID: "temperature_celsius", ValueKey: "temperature_celsius", Unit: "°C", DeviceClass: "temperature", StateClass: "measurement"},
}

var containerBinarySensors = map[string]binarySensorDefinition{
	"running": {NameSuffix: "Running", ObjectID: "running", ValueKey: "running", PayloadOn: "1", PayloadOff: "0", Icon: "mdi:docker"},
}

var vmBinarySensors = map[string]binarySensorDefinition{
	"running": {NameSuffix: "Running", ObjectID: "running", ValueKey: "running", PayloadOn: "1", PayloadOff: "0", Icon: "mdi:desktop-tower-monitor"},
}

var filesystemBinarySensors = map[string]binarySensorDefinition{
	"readonly": {NameSuffix: "Read Only", ObjectID: "read_only", ValueKey: "read_only", PayloadOn: "1", PayloadOff: "0", DeviceClass: "problem", Icon: "mdi:file-lock"},
}

var networkBinarySensors = map[string]binarySensorDefinition{
	"carrier": {NameSuffix: "Carrier", ObjectID: "carrier", ValueKey: "carrier", PayloadOn: "1", PayloadOff: "0", DeviceClass: "connectivity"},
}

var bondBinarySensors = map[string]binarySensorDefinition{
	"carrier": {NameSuffix: "Carrier", ObjectID: "carrier", ValueKey: "carrier", PayloadOn: "1", PayloadOff: "0", DeviceClass: "connectivity"},
}

var bondSlaveBinarySensors = map[string]binarySensorDefinition{
	"carrier": {NameSuffix: "Carrier", ObjectID: "carrier", ValueKey: "carrier", PayloadOn: "1", PayloadOff: "0", DeviceClass: "connectivity"},
	"active":  {NameSuffix: "Active", ObjectID: "active", ValueKey: "active", PayloadOn: "1", PayloadOff: "0", Icon: "mdi:check-network"},
}

var arrayBinarySensors = map[string]binarySensorDefinition{
	"degraded": {NameSuffix: "Degraded", ObjectID: "degraded", ValueKey: "degraded_disks", PayloadOn: "ON", PayloadOff: "OFF", DeviceClass: "problem", Icon: "mdi:alert"},
}

var upsBinarySensors = map[string]binarySensorDefinition{
	"online":      {NameSuffix: "Online", ObjectID: "online", ValueKey: "online", PayloadOn: "1", PayloadOff: "0", Icon: "mdi:power-plug"},
	"on_battery":  {NameSuffix: "On Battery", ObjectID: "on_battery", ValueKey: "on_battery", PayloadOn: "1", PayloadOff: "0", Icon: "mdi:battery-arrow-down"},
	"low_battery": {NameSuffix: "Low Battery", ObjectID: "low_battery", ValueKey: "low_battery", PayloadOn: "1", PayloadOff: "0", DeviceClass: "problem", Icon: "mdi:battery-alert"},
}

func NewMQTTPublisher(cfg MQTTConfig) (*MQTTPublisher, error) {
	if cfg.TopicPrefix == "" {
		cfg.TopicPrefix = "ugos_bridge"
	}
	if cfg.DiscoveryPrefix == "" {
		cfg.DiscoveryPrefix = "homeassistant"
	}
	if cfg.ClientID == "" {
		cfg.ClientID = "ugos-bridge"
	}
	if cfg.ConnectTimeout <= 0 {
		cfg.ConnectTimeout = 10 * time.Second
	}

	p := &MQTTPublisher{
		cfg:                cfg,
		log:                cfg.Log,
		availabilityTopic:  fmt.Sprintf("%s/status", trimSlashes(cfg.TopicPrefix)),
		availabilityOnline: newAvailabilityPayload(cfg.ClientID),
		discoveredEntities: map[string]publishedEntity{},
		lastPayloads:       map[string]string{},
		preparedPayloads:   map[string]preparedPayload{},
	}

	opts := mqtt.NewClientOptions()
	opts.AddBroker(cfg.Broker)
	opts.SetClientID(cfg.ClientID)
	opts.SetUsername(cfg.Username)
	opts.SetPassword(cfg.Password)
	opts.SetAutoReconnect(true)
	opts.SetConnectRetry(true)
	opts.SetConnectRetryInterval(cfg.ConnectTimeout)
	opts.SetConnectTimeout(cfg.ConnectTimeout)
	opts.SetCleanSession(false)
	opts.SetOrderMatters(false)
	opts.SetWill(p.availabilityTopic, "offline", cfg.QoS, true)
	opts.OnConnect = func(client mqtt.Client) {
		p.replayPending.Store(true)
		token := client.Publish(p.availabilityTopic, cfg.QoS, true, p.availablePayload())
		token.Wait()
		if token.Error() != nil {
			p.log.Error().Err(token.Error()).Msg("failed to publish MQTT availability")
		}
	}
	opts.SetConnectionLostHandler(func(_ mqtt.Client, err error) {
		p.log.Error().Err(err).Msg("MQTT connection lost")
	})

	p.client = mqtt.NewClient(opts)
	connectToken := p.client.Connect()
	if !connectToken.WaitTimeout(cfg.ConnectTimeout) {
		p.log.Warn().
			Str("broker", cfg.Broker).
			Dur("timeout", cfg.ConnectTimeout).
			Msg("timeout connecting to MQTT broker; will retry in background")
		return p, nil
	}
	if err := connectToken.Error(); err != nil {
		return nil, fmt.Errorf("connect to MQTT broker %q: %w", cfg.Broker, err)
	}

	return p, nil
}

func (p *MQTTPublisher) Close() {
	if p.client == nil || !p.client.IsConnected() {
		return
	}
	token := p.client.Publish(p.availabilityTopic, p.cfg.QoS, true, "offline")
	token.Wait()
	p.client.Disconnect(250)
}

func (p *MQTTPublisher) PublishSnapshot(snapshot model.Snapshot) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.client == nil || !p.client.IsConnectionOpen() {
		return fmt.Errorf("%w: %q", ErrNotConnected, p.cfg.Broker)
	}
	if p.replayPending.Swap(false) {
		p.lastPayloads = map[string]string{}
	}
	p.preparedPayloads = map[string]preparedPayload{}

	currentEntities := map[string]publishedEntity{}

	if snapshot.Host != nil {
		if err := p.publishHost(snapshot, currentEntities); err != nil {
			return err
		}
	}
	if err := p.publishProjects(snapshot, currentEntities); err != nil {
		return err
	}
	if err := p.publishContainers(snapshot, currentEntities); err != nil {
		return err
	}
	if err := p.publishVirtualMachines(snapshot, currentEntities); err != nil {
		return err
	}

	for key, entity := range p.discoveredEntities {
		if current, ok := currentEntities[key]; ok {
			p.discoveredEntities[key] = current
			continue
		}

		entity.missingPolls++
		if entity.missingPolls == p.unavailableAfter() {
			if err := p.publishRawIfChanged(entity.availabilityTopic, "offline"); err != nil {
				return err
			}
		}
		if entity.missingPolls < p.removeAfter() {
			p.discoveredEntities[key] = entity
			continue
		}

		if err := p.publishRetainedRawIfChanged(entity.discoveryTopic, ""); err != nil {
			return err
		}
		if err := p.publishRetainedRawIfChanged(entity.stateTopic, ""); err != nil {
			return err
		}
		if err := p.publishRetainedRawIfChanged(entity.availabilityTopic, ""); err != nil {
			return err
		}
		delete(p.discoveredEntities, key)
	}
	for key, entity := range currentEntities {
		if _, ok := p.discoveredEntities[key]; !ok {
			p.discoveredEntities[key] = entity
		}
	}

	return nil
}

func (p *MQTTPublisher) publishProjects(snapshot model.Snapshot, currentEntities map[string]publishedEntity) error {
	for _, project := range snapshot.Projects {
		if err := p.publishProjectState(currentEntities, project.Name, project.CPUPercent, project.MemoryUsageBytes, project.TotalContainers, project.RunningContainers, "Project", "Project"); err != nil {
			return err
		}
	}
	if snapshot.Host != nil && len(snapshot.Host.VMs) > 0 {
		total, running, cpu, memory := virtualMachineProjectTotals(snapshot.Host.VMs)
		if err := p.publishProjectState(currentEntities, "Virtual machines", cpu, memory, total, running, "Virtual Machine Project", "Virtual Machines"); err != nil {
			return err
		}
	}
	return nil
}

func (p *MQTTPublisher) publishProjectState(currentEntities map[string]publishedEntity, name string, cpuPercent float64, memoryBytes uint64, total int, running int, modelName string, entityPrefix string) error {
	slug := slugify(name)
	stateTopic := fmt.Sprintf("%s/projects/%s/state", trimSlashes(p.cfg.TopicPrefix), slug)
	values := map[string]any{
		"cpu_usage_percent":  cpuPercent,
		"memory_usage_bytes": memoryBytes,
		"total_containers":   total,
		"running_containers": running,
	}
	p.preparePayload(stateTopic, values, map[string]any{
		"project":      name,
		"project_slug": slug,
	})

	for key, def := range projectSensors {
		entityKey := fmt.Sprintf("project:%s:%s", slug, key)
		discoveryTopic := p.discoveryTopic("sensor", "project_"+slug, def.ObjectID)
		if err := p.ensureSensor(discoveryTopic, stateTopic, currentEntities, entityKey, name, def, deviceDescriptor{
			ID:           fmt.Sprintf("ugos_bridge_project_%s", slug),
			Name:         fmt.Sprintf("%s %s", entityPrefix, name),
			Manufacturer: "RCooLeR",
			Model:        modelName,
		}); err != nil {
			return err
		}
	}
	return nil
}

func (p *MQTTPublisher) publishContainers(snapshot model.Snapshot, currentEntities map[string]publishedEntity) error {
	for _, container := range snapshot.Containers {
		slug := slugify(container.Name)
		stateTopic := fmt.Sprintf("%s/containers/%s/state", trimSlashes(p.cfg.TopicPrefix), slug)
		values := map[string]any{
			"cpu_usage_percent":  container.CPUPercent,
			"memory_usage_bytes": container.MemoryUsageBytes,
			"running":            boolToInt(container.Running),
		}
		p.preparePayload(stateTopic, values, map[string]any{
			"container":          container.Name,
			"container_slug":     slug,
			"container_id":       shortID(container.ID),
			"project":            container.Project,
			"project_slug":       slugify(container.Project),
			"image":              container.Image,
			"memory_limit_bytes": container.MemoryLimitBytes,
			"state":              container.State,
			"status":             container.Status,
		})

		for key, def := range containerSensors {
			entityKey := fmt.Sprintf("container:%s:%s", slug, key)
			discoveryTopic := p.discoveryTopic("sensor", "container_"+slug, def.ObjectID)
			if err := p.ensureSensor(discoveryTopic, stateTopic, currentEntities, entityKey, container.Name, def, deviceDescriptor{
				ID:           fmt.Sprintf("ugos_bridge_container_%s", slug),
				Name:         fmt.Sprintf("Docker container %s", container.Name),
				ViaDeviceID:  fmt.Sprintf("ugos_bridge_project_%s", slugify(container.Project)),
				Manufacturer: "RCooLeR",
				Model:        "Docker Container",
			}); err != nil {
				return err
			}
		}
		for key, def := range containerBinarySensors {
			entityKey := fmt.Sprintf("container_binary:%s:%s", slug, key)
			discoveryTopic := p.discoveryTopic("binary_sensor", "container_"+slug, def.ObjectID)
			if err := p.ensureBinarySensor(discoveryTopic, stateTopic, currentEntities, entityKey, container.Name, def, deviceDescriptor{
				ID:           fmt.Sprintf("ugos_bridge_container_%s", slug),
				Name:         fmt.Sprintf("Docker container %s", container.Name),
				ViaDeviceID:  fmt.Sprintf("ugos_bridge_project_%s", slugify(container.Project)),
				Manufacturer: "RCooLeR",
				Model:        "Docker Container",
			}); err != nil {
				return err
			}
		}
	}
	return nil
}

func (p *MQTTPublisher) publishVirtualMachines(snapshot model.Snapshot, currentEntities map[string]publishedEntity) error {
	if snapshot.Host == nil {
		return nil
	}

	projectSlug := slugify("Virtual machines")
	for _, vm := range snapshot.Host.VMs {
		slug := slugify(vm.UGOSVMID)
		stateTopic := fmt.Sprintf("%s/virtual_machines/%s/state", trimSlashes(p.cfg.TopicPrefix), slug)
		values := map[string]any{
			"cpu_usage_percent":    vm.CPUPercent,
			"memory_usage_bytes":   vmMemoryUsageBytes(vm),
			"memory_current_bytes": vm.MemoryBytes,
			"running":              boolToInt(vm.Running),
			"vcpus":                vm.VCPUs,
			"disk_read_bytes":      vm.DiskReadBytes,
			"disk_write_bytes":     vm.DiskWriteBytes,
		}
		p.preparePayload(stateTopic, values, payloadWithout(virtualMachineContainerAttribute(vm),
			"cpu_usage_percent",
			"memory_usage_bytes",
			"memory_current_bytes",
			"running",
			"vcpus",
			"disk_read_bytes",
			"disk_write_bytes",
		))

		device := deviceDescriptor{
			ID:           fmt.Sprintf("ugos_bridge_vm_%s", slug),
			Name:         fmt.Sprintf("Virtual machine %s", vm.Name),
			ViaDeviceID:  fmt.Sprintf("ugos_bridge_project_%s", projectSlug),
			Manufacturer: "RCooLeR",
			Model:        "UGOS Virtual Machine",
		}
		for key, def := range vmSensors {
			entityKey := fmt.Sprintf("vm:%s:%s", slug, key)
			discoveryTopic := p.discoveryTopic("sensor", "vm_"+slug, def.ObjectID)
			if err := p.ensureSensor(discoveryTopic, stateTopic, currentEntities, entityKey, vm.Name, def, device); err != nil {
				return err
			}
		}
		for key, def := range vmBinarySensors {
			entityKey := fmt.Sprintf("vm_binary:%s:%s", slug, key)
			discoveryTopic := p.discoveryTopic("binary_sensor", "vm_"+slug, def.ObjectID)
			if err := p.ensureBinarySensor(discoveryTopic, stateTopic, currentEntities, entityKey, vm.Name, def, device); err != nil {
				return err
			}
		}
	}
	return nil
}

func (p *MQTTPublisher) publishHost(snapshot model.Snapshot, currentEntities map[string]publishedEntity) error {
	hostSnapshot := snapshot.Host
	hostSlug := slugify(hostSnapshot.Name)
	hostDeviceID := fmt.Sprintf("ugos_bridge_host_%s", hostSlug)
	hostStateTopic := fmt.Sprintf("%s/host/state", trimSlashes(p.cfg.TopicPrefix))

	hostValues := map[string]any{
		"cpu_usage_percent":   hostSnapshot.CPU.UsagePercent,
		"cpu_frequency_mhz":   hostSnapshot.CPU.CurrentMHz,
		"load_1":              hostSnapshot.CPU.Load1,
		"memory_used_bytes":   hostSnapshot.Memory.UsedBytes,
		"memory_used_percent": percentage(hostSnapshot.Memory.UsedBytes, hostSnapshot.Memory.TotalBytes),
		"swap_used_percent":   percentage(hostSnapshot.Memory.SwapUsedBytes, hostSnapshot.Memory.SwapTotalBytes),
		"uptime_seconds":      hostSnapshot.CPU.UptimeSeconds,
	}
	p.preparePayload(hostStateTopic, hostValues, map[string]any{
		"host":                   hostSnapshot.Name,
		"cpu_cores":              cpuCoreAttributes(hostSnapshot.CPU.CoreUsage),
		"top_processes":          topProcessAttributes(hostSnapshot.Processes, defaultTopProcessLimit),
		"memory_used_bytes":      hostSnapshot.Memory.UsedBytes,
		"memory_total_bytes":     hostSnapshot.Memory.TotalBytes,
		"memory_free_bytes":      hostSnapshot.Memory.FreeBytes,
		"memory_available_bytes": hostSnapshot.Memory.AvailableBytes,
		"memory_cached_bytes":    hostSnapshot.Memory.CachedBytes,
		"memory_buffers_bytes":   hostSnapshot.Memory.BuffersBytes,
		"swap_used_bytes":        hostSnapshot.Memory.SwapUsedBytes,
		"swap_total_bytes":       hostSnapshot.Memory.SwapTotalBytes,
		"swap_free_bytes":        hostSnapshot.Memory.SwapFreeBytes,
	})

	for key, def := range hostSensors {
		entityKey := fmt.Sprintf("host:%s:%s", hostSlug, key)
		discoveryTopic := p.discoveryTopic("sensor", "host_"+hostSlug, def.ObjectID)
		if err := p.ensureSensor(discoveryTopic, hostStateTopic, currentEntities, entityKey, hostSnapshot.Name, def, deviceDescriptor{
			ID:           hostDeviceID,
			Name:         hostSnapshot.Name,
			Manufacturer: "RCooLeR",
			Model:        "UGOS Bridge Host",
		}); err != nil {
			return err
		}
	}

	for _, process := range p.allowedProcesses(hostSnapshot.Processes) {
		slug := slugify(process.Name)
		stateTopic := fmt.Sprintf("%s/host/processes/%s/state", trimSlashes(p.cfg.TopicPrefix), slug)
		values := map[string]any{
			"process_count":      process.ProcessCount,
			"cpu_usage_percent":  process.CPUPercent,
			"memory_usage_bytes": process.MemoryBytes,
			"cpu_time_seconds":   process.CPUTimeSeconds,
		}
		p.preparePayload(stateTopic, values, map[string]any{"name": process.Name})

		for key, def := range processSensors {
			entityKey := fmt.Sprintf("process:%s:%s", slug, key)
			discoveryTopic := p.discoveryTopic("sensor", "process_"+slug, def.ObjectID)
			if err := p.ensureSensor(discoveryTopic, stateTopic, currentEntities, entityKey, process.Name, def, deviceDescriptor{
				ID:           fmt.Sprintf("%s_process_%s", hostDeviceID, slug),
				Name:         fmt.Sprintf("%s Software %s", hostSnapshot.Name, process.Name),
				ViaDeviceID:  hostDeviceID,
				Manufacturer: "RCooLeR",
				Model:        "Host Software",
			}); err != nil {
				return err
			}
		}
	}

	for _, array := range hostSnapshot.Arrays {
		slug := slugify(array.Name)
		stateTopic := fmt.Sprintf("%s/host/arrays/%s/state", trimSlashes(p.cfg.TopicPrefix), slug)
		values := map[string]any{
			"degraded_disks":         array.DegradedDisks,
			"active_disks":           array.DisksActive,
			"total_disks":            array.DisksTotal,
			"sync_completed_percent": array.SyncCompletedPercent,
			"size_bytes":             array.SizeBytes,
			"level":                  array.Level,
		}
		p.preparePayload(stateTopic, values, map[string]any{
			"name":        array.Name,
			"state":       array.State,
			"members":     array.Members,
			"mountpoints": array.Mountpoints,
			"sync_action": array.SyncAction,
		})

		for key, def := range arraySensors {
			entityKey := fmt.Sprintf("array:%s:%s", slug, key)
			discoveryTopic := p.discoveryTopic("sensor", "array_"+slug, def.ObjectID)
			if err := p.ensureSensor(discoveryTopic, stateTopic, currentEntities, entityKey, fmt.Sprintf("%s %s", hostSnapshot.Name, array.Name), def, deviceDescriptor{
				ID:           fmt.Sprintf("%s_array_%s", hostDeviceID, slug),
				Name:         fmt.Sprintf("%s Array %s", hostSnapshot.Name, array.Name),
				ViaDeviceID:  hostDeviceID,
				Manufacturer: "RCooLeR",
				Model:        strings.ToUpper(array.Level),
			}); err != nil {
				return err
			}
		}
		for key, def := range arrayBinarySensors {
			entityKey := fmt.Sprintf("array_binary:%s:%s", slug, key)
			discoveryTopic := p.discoveryTopic("binary_sensor", "array_"+slug, def.ObjectID)
			if err := p.ensureBinarySensor(discoveryTopic, stateTopic, currentEntities, entityKey, fmt.Sprintf("%s %s", hostSnapshot.Name, array.Name), def, deviceDescriptor{
				ID:           fmt.Sprintf("%s_array_%s", hostDeviceID, slug),
				Name:         fmt.Sprintf("%s Array %s", hostSnapshot.Name, array.Name),
				ViaDeviceID:  hostDeviceID,
				Manufacturer: "RCooLeR",
				Model:        strings.ToUpper(array.Level),
			}); err != nil {
				return err
			}
		}
	}

	for _, fs := range hostSnapshot.Filesystems {
		slug := slugify(fs.Name)
		stateTopic := fmt.Sprintf("%s/host/filesystems/%s/state", trimSlashes(p.cfg.TopicPrefix), slug)
		values := map[string]any{
			"used_bytes":   fs.UsedBytes,
			"free_bytes":   fs.FreeBytes,
			"used_percent": percentage(fs.UsedBytes, fs.TotalBytes),
			"read_only":    boolToInt(fs.ReadOnly),
		}
		p.preparePayload(stateTopic, values, map[string]any{
			"name":            fs.Name,
			"path":            fs.Path,
			"source":          fs.Source,
			"fstype":          fs.FSType,
			"array":           fs.Array,
			"total_bytes":     fs.TotalBytes,
			"available_bytes": fs.AvailableBytes,
			"files_total":     fs.FilesTotal,
			"files_used":      fs.FilesUsed,
			"files_free":      fs.FilesFree,
		})

		for key, def := range filesystemSensors {
			entityKey := fmt.Sprintf("filesystem:%s:%s", slug, key)
			discoveryTopic := p.discoveryTopic("sensor", "filesystem_"+slug, def.ObjectID)
			viaDeviceID := hostDeviceID
			if fs.Array != "" {
				viaDeviceID = fmt.Sprintf("%s_array_%s", hostDeviceID, slugify(fs.Array))
			}
			if err := p.ensureSensor(discoveryTopic, stateTopic, currentEntities, entityKey, fmt.Sprintf("%s %s", hostSnapshot.Name, fs.Name), def, deviceDescriptor{
				ID:           fmt.Sprintf("%s_filesystem_%s", hostDeviceID, slug),
				Name:         fmt.Sprintf("%s Filesystem %s", hostSnapshot.Name, fs.Name),
				ViaDeviceID:  viaDeviceID,
				Manufacturer: "RCooLeR",
				Model:        "Filesystem",
			}); err != nil {
				return err
			}
		}
		for key, def := range filesystemBinarySensors {
			entityKey := fmt.Sprintf("filesystem_binary:%s:%s", slug, key)
			discoveryTopic := p.discoveryTopic("binary_sensor", "filesystem_"+slug, def.ObjectID)
			viaDeviceID := hostDeviceID
			if fs.Array != "" {
				viaDeviceID = fmt.Sprintf("%s_array_%s", hostDeviceID, slugify(fs.Array))
			}
			if err := p.ensureBinarySensor(discoveryTopic, stateTopic, currentEntities, entityKey, fmt.Sprintf("%s %s", hostSnapshot.Name, fs.Name), def, deviceDescriptor{
				ID:           fmt.Sprintf("%s_filesystem_%s", hostDeviceID, slug),
				Name:         fmt.Sprintf("%s Filesystem %s", hostSnapshot.Name, fs.Name),
				ViaDeviceID:  viaDeviceID,
				Manufacturer: "RCooLeR",
				Model:        "Filesystem",
			}); err != nil {
				return err
			}
		}
	}

	diskIDs := make(map[string]string, len(hostSnapshot.Disks))
	for _, disk := range hostSnapshot.Disks {
		slug := diskIdentitySlug(disk)
		diskIDs[disk.Name] = slug
		legacySlug := slugify(disk.Name)
		if slug != legacySlug {
			for _, def := range diskSensors {
				if err := p.publishRetainedRawIfChanged(p.discoveryTopic("sensor", "disk_"+legacySlug, def.ObjectID), ""); err != nil {
					return err
				}
			}
			legacyStateTopic := fmt.Sprintf("%s/host/disks/%s/state", trimSlashes(p.cfg.TopicPrefix), legacySlug)
			if err := p.publishRetainedRawIfChanged(legacyStateTopic, ""); err != nil {
				return err
			}
		}
		stateTopic := fmt.Sprintf("%s/host/disks/%s/state", trimSlashes(p.cfg.TopicPrefix), slug)
		values := map[string]any{
			"read_bytes_per_second":  disk.ReadBytesPerSec,
			"write_bytes_per_second": disk.WriteBytesPerSec,
			"busy_percent":           disk.BusyPercent,
			"size_bytes":             disk.SizeBytes,
			"model":                  disk.Model,
			"vendor":                 disk.Vendor,
			"serial":                 disk.Serial,
			"type":                   disk.Type,
		}
		p.preparePayload(stateTopic, values, map[string]any{
			"name":     disk.Name,
			"path":     disk.Path,
			"identity": slug,
			"model":    disk.Model,
			"vendor":   disk.Vendor,
			"serial":   disk.Serial,
			"type":     disk.Type,
		})

		for key, def := range diskSensors {
			entityKey := fmt.Sprintf("disk:%s:%s", slug, key)
			discoveryTopic := p.discoveryTopic("sensor", "disk_"+slug, def.ObjectID)
			if err := p.ensureSensor(discoveryTopic, stateTopic, currentEntities, entityKey, fmt.Sprintf("%s %s", hostSnapshot.Name, disk.Name), def, deviceDescriptor{
				ID:           fmt.Sprintf("%s_disk_%s", hostDeviceID, slug),
				Name:         fmt.Sprintf("%s Disk %s", hostSnapshot.Name, disk.Name),
				ViaDeviceID:  hostDeviceID,
				Manufacturer: "RCooLeR",
				Model:        strings.ToUpper(disk.Type),
			}); err != nil {
				return err
			}
		}
	}

	for _, bond := range hostSnapshot.Bonds {
		slug := slugify(bond.Name)
		deviceID := fmt.Sprintf("%s_bond_%s", hostDeviceID, slug)
		stateTopic := fmt.Sprintf("%s/host/bonds/%s/state", trimSlashes(p.cfg.TopicPrefix), slug)
		values := map[string]any{
			"speed_mbps":   bond.SpeedMbps,
			"carrier":      boolToInt(bond.Carrier),
			"mode":         bond.Mode,
			"active_slave": bond.ActiveSlave,
			"mii_status":   bond.MIIStatus,
			"slave_count":  len(bond.Slaves),
		}
		p.preparePayload(stateTopic, values, map[string]any{
			"name":       bond.Name,
			"primary":    bond.Primary,
			"oper_state": bond.OperState,
			"slaves":     bondSlaveAttributes(bond.Slaves),
		})

		for key, def := range bondSensors {
			entityKey := fmt.Sprintf("bond:%s:%s", slug, key)
			discoveryTopic := p.discoveryTopic("sensor", "bond_"+slug, def.ObjectID)
			if err := p.ensureSensor(discoveryTopic, stateTopic, currentEntities, entityKey, fmt.Sprintf("%s %s", hostSnapshot.Name, bond.Name), def, deviceDescriptor{
				ID:           deviceID,
				Name:         fmt.Sprintf("%s Bond %s", hostSnapshot.Name, bond.Name),
				ViaDeviceID:  hostDeviceID,
				Manufacturer: "RCooLeR",
				Model:        "Bond Interface",
			}); err != nil {
				return err
			}
		}
		for key, def := range bondBinarySensors {
			entityKey := fmt.Sprintf("bond_binary:%s:%s", slug, key)
			discoveryTopic := p.discoveryTopic("binary_sensor", "bond_"+slug, def.ObjectID)
			if err := p.ensureBinarySensor(discoveryTopic, stateTopic, currentEntities, entityKey, fmt.Sprintf("%s %s", hostSnapshot.Name, bond.Name), def, deviceDescriptor{
				ID:           deviceID,
				Name:         fmt.Sprintf("%s Bond %s", hostSnapshot.Name, bond.Name),
				ViaDeviceID:  hostDeviceID,
				Manufacturer: "RCooLeR",
				Model:        "Bond Interface",
			}); err != nil {
				return err
			}
		}

		for _, slave := range bond.Slaves {
			slaveSlug := slugify(slave.Name)
			slaveStateTopic := fmt.Sprintf("%s/host/bonds/%s/slaves/%s/state", trimSlashes(p.cfg.TopicPrefix), slug, slaveSlug)
			slaveValues := map[string]any{
				"speed_mbps": slave.SpeedMbps,
				"carrier":    boolToInt(slave.Carrier),
				"active":     boolToInt(slave.Active),
				"mii_status": slave.MIIStatus,
			}
			p.preparePayload(slaveStateTopic, slaveValues, map[string]any{
				"name":       slave.Name,
				"oper_state": slave.OperState,
				"duplex":     slave.Duplex,
			})

			for key, def := range bondSlaveSensors {
				entityKey := fmt.Sprintf("bond_slave:%s:%s:%s", slug, slaveSlug, key)
				discoveryTopic := p.discoveryTopic("sensor", "bond_"+slug+"_slave_"+slaveSlug, def.ObjectID)
				if err := p.ensureSensor(discoveryTopic, slaveStateTopic, currentEntities, entityKey, fmt.Sprintf("%s %s", hostSnapshot.Name, slave.Name), def, deviceDescriptor{
					ID:           fmt.Sprintf("%s_bond_%s_slave_%s", hostDeviceID, slug, slaveSlug),
					Name:         fmt.Sprintf("%s Bond %s Slave %s", hostSnapshot.Name, bond.Name, slave.Name),
					ViaDeviceID:  deviceID,
					Manufacturer: "RCooLeR",
					Model:        "Bond Slave Interface",
				}); err != nil {
					return err
				}
			}
			for key, def := range bondSlaveBinarySensors {
				entityKey := fmt.Sprintf("bond_slave_binary:%s:%s:%s", slug, slaveSlug, key)
				discoveryTopic := p.discoveryTopic("binary_sensor", "bond_"+slug+"_slave_"+slaveSlug, def.ObjectID)
				if err := p.ensureBinarySensor(discoveryTopic, slaveStateTopic, currentEntities, entityKey, fmt.Sprintf("%s %s", hostSnapshot.Name, slave.Name), def, deviceDescriptor{
					ID:           fmt.Sprintf("%s_bond_%s_slave_%s", hostDeviceID, slug, slaveSlug),
					Name:         fmt.Sprintf("%s Bond %s Slave %s", hostSnapshot.Name, bond.Name, slave.Name),
					ViaDeviceID:  deviceID,
					Manufacturer: "RCooLeR",
					Model:        "Bond Slave Interface",
				}); err != nil {
					return err
				}
			}
		}
	}

	for _, network := range hostSnapshot.Networks {
		slug := slugify(network.Name)
		viaDeviceID := hostDeviceID
		if network.Master != "" {
			viaDeviceID = fmt.Sprintf("%s_bond_%s", hostDeviceID, slugify(network.Master))
		}
		stateTopic := fmt.Sprintf("%s/host/networks/%s/state", trimSlashes(p.cfg.TopicPrefix), slug)
		values := map[string]any{
			"rx_bytes_per_second": network.RxBytesPerSec,
			"tx_bytes_per_second": network.TxBytesPerSec,
			"speed_mbps":          network.SpeedMbps,
			"carrier":             boolToInt(network.Carrier),
		}
		p.preparePayload(stateTopic, values, map[string]any{
			"name":       network.Name,
			"master":     network.Master,
			"mac":        network.MAC,
			"oper_state": network.OperState,
			"duplex":     network.Duplex,
			"mtu":        network.MTU,
		})

		for key, def := range networkSensors {
			if key == "carrier" {
				continue
			}
			entityKey := fmt.Sprintf("network:%s:%s", slug, key)
			discoveryTopic := p.discoveryTopic("sensor", "network_"+slug, def.ObjectID)
			if err := p.ensureSensor(discoveryTopic, stateTopic, currentEntities, entityKey, fmt.Sprintf("%s %s", hostSnapshot.Name, network.Name), def, deviceDescriptor{
				ID:           fmt.Sprintf("%s_network_%s", hostDeviceID, slug),
				Name:         fmt.Sprintf("%s Network %s", hostSnapshot.Name, network.Name),
				ViaDeviceID:  viaDeviceID,
				Manufacturer: "RCooLeR",
				Model:        "Network Interface",
			}); err != nil {
				return err
			}
		}
		for key, def := range networkBinarySensors {
			entityKey := fmt.Sprintf("network_binary:%s:%s", slug, key)
			discoveryTopic := p.discoveryTopic("binary_sensor", "network_"+slug, def.ObjectID)
			if err := p.ensureBinarySensor(discoveryTopic, stateTopic, currentEntities, entityKey, fmt.Sprintf("%s %s", hostSnapshot.Name, network.Name), def, deviceDescriptor{
				ID:           fmt.Sprintf("%s_network_%s", hostDeviceID, slug),
				Name:         fmt.Sprintf("%s Network %s", hostSnapshot.Name, network.Name),
				ViaDeviceID:  viaDeviceID,
				Manufacturer: "RCooLeR",
				Model:        "Network Interface",
			}); err != nil {
				return err
			}
		}
	}

	for _, gpu := range hostSnapshot.GPUs {
		slug := slugify(gpu.Name)
		stateTopic := fmt.Sprintf("%s/host/gpus/%s/state", trimSlashes(p.cfg.TopicPrefix), slug)
		values := map[string]any{
			"current_mhz": gpu.CurrentMHz,
			"max_mhz":     gpu.MaxMHz,
		}
		attributes := map[string]any{
			"name":      gpu.Name,
			"boost_mhz": gpu.BoostMHz,
			"driver":    gpu.Driver,
			"vendor":    gpu.Vendor,
			"device":    gpu.Device,
			"card_path": gpu.CardPath,
		}
		if gpu.BusyAvailable {
			values["busy_percent"] = gpu.BusyPercent
		}
		if gpu.IntelTop != nil {
			attributes["engines"] = gpuEngineAttributes(gpu.IntelTop.Engines)
			attributes["stats"] = gpuStatAttributes(gpu.IntelTop)
		}
		p.preparePayload(stateTopic, values, attributes)

		for key, def := range gpuSensors {
			if key == "busy" && !gpu.BusyAvailable {
				continue
			}
			entityKey := fmt.Sprintf("gpu:%s:%s", slug, key)
			discoveryTopic := p.discoveryTopic("sensor", "gpu_"+slug, def.ObjectID)
			if err := p.ensureSensor(discoveryTopic, stateTopic, currentEntities, entityKey, fmt.Sprintf("%s %s", hostSnapshot.Name, gpu.Name), def, deviceDescriptor{
				ID:           fmt.Sprintf("%s_gpu_%s", hostDeviceID, slug),
				Name:         fmt.Sprintf("%s GPU %s", hostSnapshot.Name, gpu.Name),
				ViaDeviceID:  hostDeviceID,
				Manufacturer: "RCooLeR",
				Model:        gpu.Driver,
			}); err != nil {
				return err
			}
		}
	}

	genericSensorSlugs := map[string]struct{}{}
	for _, sensor := range hostSnapshot.Sensors {
		if sensor.DeviceType != "disk" || sensor.DeviceName == "" {
			genericSensorSlugs[slugify(sensor.Source+"_"+sensor.Chip+"_"+sensor.Name)] = struct{}{}
		}
	}

	for _, sensor := range hostSnapshot.Sensors {
		def, ok := healthSensors[sensor.Kind]
		if !ok {
			continue
		}

		chipSlug := slugify(sensor.Chip)
		diskSlug := ""
		if sensor.DeviceType == "disk" && sensor.DeviceName != "" {
			diskSlug = firstNonEmpty(diskIDs[sensor.DeviceName], "name_"+slugify(sensor.DeviceName))
		}
		sensorIdentity := sensor.Source + "_" + sensor.Chip + "_" + sensor.Name
		if diskSlug != "" {
			sensorIdentity = sensor.Source + "_" + diskSlug + "_" + sensor.Chip + "_" + sensor.Name
		}
		sensorSlug := slugify(sensorIdentity)
		if diskSlug != "" {
			legacySensorSlug := slugify(sensor.Source + "_" + sensor.Chip + "_" + sensor.Name)
			if _, usedByGenericSensor := genericSensorSlugs[legacySensorSlug]; legacySensorSlug != sensorSlug && !usedByGenericSensor {
				if err := p.publishRetainedRawIfChanged(p.discoveryTopic("sensor", legacySensorSlug, def.ObjectID), ""); err != nil {
					return err
				}
				legacyStateTopic := fmt.Sprintf("%s/host/sensors/%s/state", trimSlashes(p.cfg.TopicPrefix), legacySensorSlug)
				if err := p.publishRetainedRawIfChanged(legacyStateTopic, ""); err != nil {
					return err
				}
			}
		}
		stateTopic := fmt.Sprintf("%s/host/sensors/%s/state", trimSlashes(p.cfg.TopicPrefix), sensorSlug)
		values := map[string]any{}
		attributes := map[string]any{
			"name":        sensor.Name,
			"label":       sensor.Label,
			"chip":        sensor.Chip,
			"source":      sensor.Source,
			"device_type": sensor.DeviceType,
			"device_name": sensor.DeviceName,
		}
		switch sensor.Kind {
		case "temperature":
			values["temperature_celsius"] = sensor.Value
		case "fan":
			values["fan_speed_rpm"] = sensor.Value
		}
		p.preparePayload(stateTopic, values, attributes)

		entityKey := fmt.Sprintf("sensor:%s:%s", sensorSlug, sensor.Kind)
		discoveryTopic := p.discoveryTopic("sensor", sensorSlug, def.ObjectID)
		device := deviceDescriptor{
			ID:           fmt.Sprintf("%s_health_%s", hostDeviceID, chipSlug),
			EntityID:     fmt.Sprintf("%s_sensor_%s", hostDeviceID, sensorSlug),
			Name:         fmt.Sprintf("%s Health %s", hostSnapshot.Name, sensor.Chip),
			ViaDeviceID:  hostDeviceID,
			Manufacturer: "RCooLeR",
			Model:        displaySourceName(sensor.Source) + " Sensor",
		}
		entityName := fmt.Sprintf("%s %s", hostSnapshot.Name, sensor.Label)
		if diskSlug != "" {
			device = deviceDescriptor{
				ID:           fmt.Sprintf("%s_disk_%s", hostDeviceID, diskSlug),
				EntityID:     fmt.Sprintf("%s_disk_%s_sensor_%s", hostDeviceID, diskSlug, sensorSlug),
				Name:         fmt.Sprintf("%s Disk %s", hostSnapshot.Name, sensor.DeviceName),
				ViaDeviceID:  hostDeviceID,
				Manufacturer: "RCooLeR",
				Model:        "Disk Sensor",
			}
			entityName = fmt.Sprintf("%s %s", sensor.DeviceName, sensor.Label)
		}
		if err := p.ensureSensor(discoveryTopic, stateTopic, currentEntities, entityKey, entityName, def, device); err != nil {
			return err
		}
	}

	for _, cooling := range hostSnapshot.Cooling {
		slug := slugify(cooling.Name)
		stateTopic := fmt.Sprintf("%s/host/cooling/%s/state", trimSlashes(p.cfg.TopicPrefix), slug)
		values := map[string]any{
			"cooling_state":     cooling.CurState,
			"cooling_max_state": cooling.MaxState,
		}
		if cooling.MaxState > 0 {
			values["cooling_percent"] = cooling.Percent
		}
		p.preparePayload(stateTopic, values, map[string]any{
			"name": cooling.Name,
			"type": cooling.Type,
		})

		for key, def := range coolingSensors {
			if key == "percent" && cooling.MaxState <= 0 {
				continue
			}
			entityKey := fmt.Sprintf("cooling:%s:%s", slug, key)
			discoveryTopic := p.discoveryTopic("sensor", "cooling_"+slug, def.ObjectID)
			if err := p.ensureSensor(discoveryTopic, stateTopic, currentEntities, entityKey, fmt.Sprintf("%s %s", hostSnapshot.Name, cooling.Type), def, deviceDescriptor{
				ID:           fmt.Sprintf("%s_cooling_%s", hostDeviceID, slug),
				Name:         fmt.Sprintf("%s Cooling %s", hostSnapshot.Name, cooling.Type),
				ViaDeviceID:  hostDeviceID,
				Manufacturer: "RCooLeR",
				Model:        "Thermal Cooling Device",
			}); err != nil {
				return err
			}
		}
	}

	for _, ups := range hostSnapshot.UPSs {
		slug := slugify(ups.Name)
		stateTopic := fmt.Sprintf("%s/host/ups/%s/state", trimSlashes(p.cfg.TopicPrefix), slug)
		values := map[string]any{
			"status":      ups.Status,
			"online":      boolToInt(ups.Online),
			"on_battery":  boolToInt(ups.OnBattery),
			"low_battery": boolToInt(ups.LowBattery),
		}
		if ups.BatteryChargeAvailable {
			values["battery_charge_percent"] = ups.BatteryChargePercent
		}
		if ups.BatteryRuntimeAvailable {
			values["battery_runtime_seconds"] = ups.BatteryRuntimeSeconds
		}
		if ups.BatteryVoltageAvailable {
			values["battery_voltage"] = ups.BatteryVoltage
		}
		if ups.InputVoltageAvailable {
			values["input_voltage"] = ups.InputVoltage
		}
		if ups.OutputVoltageAvailable {
			values["output_voltage"] = ups.OutputVoltage
		}
		if ups.LoadPercentAvailable {
			values["load_percent"] = ups.LoadPercent
		}
		if ups.RealPowerWattsAvailable {
			values["real_power_watts"] = ups.RealPowerWatts
		}
		if ups.NominalRealPowerWattsAvailable {
			values["nominal_real_power_watts"] = ups.NominalRealPowerWatts
		}
		if ups.LineFrequencyHzAvailable {
			values["line_frequency_hz"] = ups.LineFrequencyHz
		}
		if ups.TemperatureCelsiusAvailable {
			values["temperature_celsius"] = ups.TemperatureCelsius
		}
		p.preparePayload(stateTopic, values, map[string]any{
			"name":         ups.Name,
			"model":        ups.Model,
			"manufacturer": ups.Manufacturer,
			"serial":       ups.Serial,
			"status":       ups.Status,
		})

		device := deviceDescriptor{
			ID:           fmt.Sprintf("%s_ups_%s", hostDeviceID, slug),
			Name:         fmt.Sprintf("%s UPS %s", hostSnapshot.Name, ups.Name),
			ViaDeviceID:  hostDeviceID,
			Manufacturer: ups.Manufacturer,
			Model:        firstNonEmpty(ups.Model, "UPS"),
		}
		entityName := fmt.Sprintf("%s %s", hostSnapshot.Name, ups.Name)
		for key, def := range upsSensors {
			if !upsSensorAvailable(ups, key) {
				continue
			}
			entityKey := fmt.Sprintf("ups:%s:%s", slug, key)
			discoveryTopic := p.discoveryTopic("sensor", "ups_"+slug, def.ObjectID)
			if err := p.ensureSensor(discoveryTopic, stateTopic, currentEntities, entityKey, entityName, def, device); err != nil {
				return err
			}
		}
		for key, def := range upsBinarySensors {
			entityKey := fmt.Sprintf("ups_binary:%s:%s", slug, key)
			discoveryTopic := p.discoveryTopic("binary_sensor", "ups_"+slug, def.ObjectID)
			if err := p.ensureBinarySensor(discoveryTopic, stateTopic, currentEntities, entityKey, entityName, def, device); err != nil {
				return err
			}
		}
	}

	return nil
}

func (p *MQTTPublisher) ensureSensor(discoveryTopic string, stateTopic string, current map[string]publishedEntity, key string, entityName string, def sensorDefinition, device deviceDescriptor) error {
	prepared, ok := p.preparedPayloads[stateTopic]
	if !ok {
		return fmt.Errorf("MQTT payload for %q was not prepared", stateTopic)
	}
	value, ok := prepared.values[def.ValueKey]
	if !ok {
		return fmt.Errorf("MQTT payload for %q has no %q value", stateTopic, def.ValueKey)
	}

	entityStateTopic := individualStateTopic(stateTopic, def.ObjectID)
	entityAvailabilityTopic := individualAvailabilityTopic(entityStateTopic)
	current[key] = publishedEntity{
		discoveryTopic:    discoveryTopic,
		stateTopic:        entityStateTopic,
		availabilityTopic: entityAvailabilityTopic,
	}

	entityID := firstNonEmpty(device.EntityID, device.ID)

	devicePayload := map[string]any{
		"identifiers": []string{device.ID},
		"name":        device.Name,
	}
	if device.ViaDeviceID != "" {
		devicePayload["via_device"] = device.ViaDeviceID
	}
	if device.Manufacturer != "" {
		devicePayload["manufacturer"] = device.Manufacturer
	}
	if device.Model != "" {
		devicePayload["model"] = device.Model
	}

	payload := map[string]any{
		"name":              strings.TrimSpace(fmt.Sprintf("%s %s", entityName, def.NameSuffix)),
		"unique_id":         fmt.Sprintf("%s_%s", entityID, def.ObjectID),
		"object_id":         fmt.Sprintf("%s_%s", entityID, def.ObjectID),
		"state_topic":       entityStateTopic,
		"availability":      p.entityAvailability(entityAvailabilityTopic),
		"availability_mode": "all",
		"device":            devicePayload,
	}
	if def.Attributes && len(prepared.attributes) > 0 {
		payload["json_attributes_topic"] = prepared.attributesTopic
	}

	if def.Icon != "" {
		payload["icon"] = def.Icon
	}
	if def.Unit != "" {
		payload["unit_of_measurement"] = def.Unit
	}
	if def.DeviceClass != "" {
		payload["device_class"] = def.DeviceClass
	}
	if def.StateClass != "" {
		payload["state_class"] = def.StateClass
	}
	if def.EntityCategory != "" {
		payload["entity_category"] = def.EntityCategory
	}

	if err := p.publishJSONIfChanged(discoveryTopic, payload); err != nil {
		return err
	}
	if def.Attributes && len(prepared.attributes) > 0 {
		if err := p.publishJSONIfChanged(prepared.attributesTopic, prepared.attributes); err != nil {
			return err
		}
	}
	if err := p.publishRawIfChanged(entityAvailabilityTopic, "online"); err != nil {
		return err
	}
	return p.publishStateValueIfChanged(entityStateTopic, value)
}

func (p *MQTTPublisher) ensureBinarySensor(discoveryTopic string, stateTopic string, current map[string]publishedEntity, key string, entityName string, def binarySensorDefinition, device deviceDescriptor) error {
	prepared, ok := p.preparedPayloads[stateTopic]
	if !ok {
		return fmt.Errorf("MQTT payload for %q was not prepared", stateTopic)
	}
	value, ok := prepared.values[def.ValueKey]
	if !ok {
		return fmt.Errorf("MQTT payload for %q has no %q value", stateTopic, def.ValueKey)
	}

	entityStateTopic := individualStateTopic(stateTopic, def.ObjectID)
	entityAvailabilityTopic := individualAvailabilityTopic(entityStateTopic)
	current[key] = publishedEntity{
		discoveryTopic:    discoveryTopic,
		stateTopic:        entityStateTopic,
		availabilityTopic: entityAvailabilityTopic,
	}

	entityID := firstNonEmpty(device.EntityID, device.ID)

	devicePayload := map[string]any{
		"identifiers": []string{device.ID},
		"name":        device.Name,
	}
	if device.ViaDeviceID != "" {
		devicePayload["via_device"] = device.ViaDeviceID
	}
	if device.Manufacturer != "" {
		devicePayload["manufacturer"] = device.Manufacturer
	}
	if device.Model != "" {
		devicePayload["model"] = device.Model
	}

	payload := map[string]any{
		"name":              strings.TrimSpace(fmt.Sprintf("%s %s", entityName, def.NameSuffix)),
		"unique_id":         fmt.Sprintf("%s_%s", entityID, def.ObjectID),
		"object_id":         fmt.Sprintf("%s_%s", entityID, def.ObjectID),
		"state_topic":       entityStateTopic,
		"payload_on":        firstNonEmpty(def.PayloadOn, "ON"),
		"payload_off":       firstNonEmpty(def.PayloadOff, "OFF"),
		"availability":      p.entityAvailability(entityAvailabilityTopic),
		"availability_mode": "all",
		"device":            devicePayload,
	}
	if def.Icon != "" {
		payload["icon"] = def.Icon
	}
	if def.DeviceClass != "" {
		payload["device_class"] = def.DeviceClass
	}
	if def.EntityCategory != "" {
		payload["entity_category"] = def.EntityCategory
	}

	if err := p.publishJSONIfChanged(discoveryTopic, payload); err != nil {
		return err
	}
	if err := p.publishRawIfChanged(entityAvailabilityTopic, "online"); err != nil {
		return err
	}
	return p.publishRawIfChanged(entityStateTopic, binaryStatePayload(value, def))
}

func (p *MQTTPublisher) discoveryTopic(component string, slug string, objectID string) string {
	return fmt.Sprintf("%s/%s/ugos_bridge_%s/%s/config", trimSlashes(p.cfg.DiscoveryPrefix), component, slug, objectID)
}

func (p *MQTTPublisher) preparePayload(stateTopic string, values map[string]any, attributes map[string]any) {
	if p.preparedPayloads == nil {
		p.preparedPayloads = map[string]preparedPayload{}
	}
	delete(values, "collected_at")
	delete(attributes, "collected_at")
	p.preparedPayloads[stateTopic] = preparedPayload{
		values:          values,
		attributes:      attributes,
		attributesTopic: strings.TrimSuffix(stateTopic, "/state") + "/attributes",
	}
}

func (p *MQTTPublisher) entityAvailability(entityTopic string) []map[string]any {
	return []map[string]any{
		{
			"topic":                 p.availabilityTopic,
			"payload_available":     p.availablePayload(),
			"payload_not_available": "offline",
		},
		{
			"topic":                 entityTopic,
			"payload_available":     "online",
			"payload_not_available": "offline",
		},
	}
}

func (p *MQTTPublisher) availablePayload() string {
	return firstNonEmpty(p.availabilityOnline, "online")
}

func (p *MQTTPublisher) unavailableAfter() int {
	if p.cfg.UnavailableAfter < 2 {
		return defaultUnavailableAfter
	}
	return p.cfg.UnavailableAfter
}

func (p *MQTTPublisher) removeAfter() int {
	if p.cfg.RemoveAfter <= p.unavailableAfter() {
		return p.unavailableAfter() * (defaultRemoveAfter / defaultUnavailableAfter)
	}
	return p.cfg.RemoveAfter
}

func (p *MQTTPublisher) allowedProcesses(processes []model.ProcessSnapshot) []model.ProcessSnapshot {
	if len(p.cfg.ProcessAllowlist) == 0 {
		return nil
	}

	allowed := make(map[string]struct{}, len(p.cfg.ProcessAllowlist))
	for _, name := range p.cfg.ProcessAllowlist {
		allowed[slugify(name)] = struct{}{}
	}

	result := make([]model.ProcessSnapshot, 0, len(allowed))
	for _, process := range processes {
		if _, ok := allowed[slugify(process.Name)]; ok {
			result = append(result, process)
		}
	}
	return result
}

func topProcessAttributes(processes []model.ProcessSnapshot, limit int) []map[string]any {
	if limit <= 0 || len(processes) == 0 {
		return []map[string]any{}
	}

	ranked := append([]model.ProcessSnapshot(nil), processes...)
	sort.Slice(ranked, func(i, j int) bool {
		if ranked[i].CPUPercent == ranked[j].CPUPercent {
			if ranked[i].MemoryBytes == ranked[j].MemoryBytes {
				return ranked[i].Name < ranked[j].Name
			}
			return ranked[i].MemoryBytes > ranked[j].MemoryBytes
		}
		return ranked[i].CPUPercent > ranked[j].CPUPercent
	})
	if len(ranked) > limit {
		ranked = ranked[:limit]
	}

	result := make([]map[string]any, 0, len(ranked))
	for _, process := range ranked {
		result = append(result, map[string]any{
			"name":               process.Name,
			"process_count":      process.ProcessCount,
			"cpu_usage_percent":  process.CPUPercent,
			"memory_usage_bytes": process.MemoryBytes,
			"cpu_time_seconds":   process.CPUTimeSeconds,
		})
	}
	return result
}

func (p *MQTTPublisher) publishJSONIfChanged(topic string, payload any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	return p.publishRawIfChanged(topic, string(body))
}

func (p *MQTTPublisher) publishStateValueIfChanged(topic string, value any) error {
	if text, ok := value.(string); ok {
		if strings.TrimSpace(text) == "" {
			text = "unknown"
		}
		return p.publishRawIfChanged(topic, text)
	}

	body, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return p.publishRawIfChanged(topic, string(body))
}

func (p *MQTTPublisher) publishRawIfChanged(topic string, payload string) error {
	return p.publishRawWithRetainIfChanged(topic, payload, p.cfg.Retain)
}

func (p *MQTTPublisher) publishRetainedRawIfChanged(topic string, payload string) error {
	return p.publishRawWithRetainIfChanged(topic, payload, true)
}

func (p *MQTTPublisher) publishRawWithRetainIfChanged(topic string, payload string, retained bool) error {
	if p.lastPayloads == nil {
		p.lastPayloads = map[string]string{}
	}
	if previous, ok := p.lastPayloads[topic]; ok && previous == payload {
		return nil
	}
	if err := p.publishRawWithRetain(topic, payload, retained); err != nil {
		return err
	}
	p.lastPayloads[topic] = payload
	return nil
}

func (p *MQTTPublisher) publishRawWithRetain(topic string, payload string, retained bool) error {
	token := p.client.Publish(topic, p.cfg.QoS, retained, payload)
	token.Wait()
	return token.Error()
}

func individualStateTopic(baseStateTopic string, objectID string) string {
	return fmt.Sprintf("%s/%s/state", strings.TrimSuffix(baseStateTopic, "/state"), slugify(objectID))
}

func individualAvailabilityTopic(stateTopic string) string {
	return strings.TrimSuffix(stateTopic, "/state") + "/availability"
}

func binaryStatePayload(value any, def binarySensorDefinition) string {
	if truthy(value) {
		return firstNonEmpty(def.PayloadOn, "ON")
	}
	return firstNonEmpty(def.PayloadOff, "OFF")
}

func truthy(value any) bool {
	switch typed := value.(type) {
	case bool:
		return typed
	case int:
		return typed != 0
	case int8:
		return typed != 0
	case int16:
		return typed != 0
	case int32:
		return typed != 0
	case int64:
		return typed != 0
	case uint:
		return typed != 0
	case uint8:
		return typed != 0
	case uint16:
		return typed != 0
	case uint32:
		return typed != 0
	case uint64:
		return typed != 0
	case float32:
		return typed != 0
	case float64:
		return typed != 0
	case string:
		switch strings.ToLower(strings.TrimSpace(typed)) {
		case "", "0", "false", "off", "no":
			return false
		default:
			return true
		}
	default:
		return value != nil
	}
}

func newAvailabilityPayload(clientID string) string {
	sum := sha256.Sum256([]byte(fmt.Sprintf("%s:%d", clientID, time.Now().UnixNano())))
	return fmt.Sprintf("online_%x", sum[:6])
}

func slugify(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	if value == "" {
		return "unknown"
	}
	if value == "/" {
		return "root"
	}
	value = nonAlphaNum.ReplaceAllString(value, "_")
	value = strings.Trim(value, "_")
	if value == "" {
		return "unknown"
	}
	return value
}

func shortID(id string) string {
	if len(id) <= 12 {
		return id
	}
	return id[:12]
}

func trimSlashes(value string) string {
	return strings.Trim(value, "/")
}

func boolToInt(value bool) int {
	if value {
		return 1
	}
	return 0
}

func payloadWithout(payload map[string]any, keys ...string) map[string]any {
	result := make(map[string]any, len(payload))
	for key, value := range payload {
		result[key] = value
	}
	for _, key := range keys {
		delete(result, key)
	}
	delete(result, "collected_at")
	return result
}

func diskIdentitySlug(disk model.DiskSnapshot) string {
	if serial := strings.TrimSpace(disk.Serial); serial != "" {
		return "serial_" + slugify(serial)
	}
	if path := strings.TrimSpace(disk.Path); path != "" {
		sum := sha256.Sum256([]byte(path))
		return fmt.Sprintf("path_%x", sum[:8])
	}
	return "name_" + slugify(disk.Name)
}

func bondSlaveAttributes(slaves []model.BondSlaveSnapshot) []map[string]any {
	if len(slaves) == 0 {
		return nil
	}
	result := make([]map[string]any, 0, len(slaves))
	for _, slave := range slaves {
		result = append(result, map[string]any{
			"name":       slave.Name,
			"mii_status": slave.MIIStatus,
			"oper_state": slave.OperState,
			"duplex":     slave.Duplex,
			"speed_mbps": slave.SpeedMbps,
			"carrier":    slave.Carrier,
			"active":     slave.Active,
		})
	}
	return result
}

func upsSensorAvailable(ups model.UPSSnapshot, key string) bool {
	switch key {
	case "status":
		return true
	case "charge":
		return ups.BatteryChargeAvailable
	case "runtime":
		return ups.BatteryRuntimeAvailable
	case "battery_volt":
		return ups.BatteryVoltageAvailable
	case "input_volt":
		return ups.InputVoltageAvailable
	case "output_volt":
		return ups.OutputVoltageAvailable
	case "load":
		return ups.LoadPercentAvailable
	case "power":
		return ups.RealPowerWattsAvailable
	case "nominal_power":
		return ups.NominalRealPowerWattsAvailable
	case "frequency":
		return ups.LineFrequencyHzAvailable
	case "temperature":
		return ups.TemperatureCelsiusAvailable
	default:
		return false
	}
}

func percentage(used uint64, total uint64) float64 {
	if total == 0 || used > total {
		return 0
	}
	return (float64(used) / float64(total)) * 100
}

func cpuCoreAttributes(cores []model.CPUCoreSnapshot) []map[string]any {
	if len(cores) == 0 {
		return nil
	}

	attributes := make([]map[string]any, 0, len(cores))
	for _, core := range cores {
		attributes = append(attributes, map[string]any{
			"name":          core.Name,
			"usage_percent": core.UsagePercent,
			"current_mhz":   core.CurrentMHz,
			"min_mhz":       core.MinMHz,
			"max_mhz":       core.MaxMHz,
			"governor":      core.Governor,
		})
	}
	return attributes
}

func gpuEngineAttributes(engines []model.GPUEngineSnapshot) []map[string]any {
	if len(engines) == 0 {
		return nil
	}

	attributes := make([]map[string]any, 0, len(engines))
	for _, engine := range engines {
		attributes = append(attributes, map[string]any{
			"name":         engine.Name,
			"busy_percent": engine.BusyPercent,
			"sema_percent": engine.SemaPercent,
			"wait_percent": engine.WaitPercent,
		})
	}
	return attributes
}

func gpuStatAttributes(stats *model.IntelGPUSnapshot) []map[string]any {
	if stats == nil {
		return nil
	}

	return []map[string]any{
		{"key": "frequency_actual_mhz", "label": "Actual Frequency", "value": stats.ActualMHz, "unit": "MHz"},
		{"key": "frequency_requested_mhz", "label": "Requested Frequency", "value": stats.RequestedMHz, "unit": "MHz"},
		{"key": "imc_bandwidth_reads_mib_per_second", "label": "IMC Reads", "value": stats.IMCReadsMiBPerSec, "unit": "MiB/s"},
		{"key": "imc_bandwidth_writes_mib_per_second", "label": "IMC Writes", "value": stats.IMCWritesMiBPerSec, "unit": "MiB/s"},
		{"key": "interrupts_per_second", "label": "Interrupts", "value": stats.InterruptsPerSec, "unit": "/s"},
		{"key": "period_milliseconds", "label": "Sample Period", "value": stats.PeriodMilliseconds, "unit": "ms"},
		{"key": "power_gpu_watts", "label": "GPU Power", "value": stats.GPUPowerWatts, "unit": "W"},
		{"key": "power_package_watts", "label": "Package Power", "value": stats.PackagePowerWatts, "unit": "W"},
		{"key": "rc6_percent", "label": "RC6", "value": stats.RC6Percent, "unit": "%"},
	}
}

func virtualMachineProjectTotals(vms []model.VirtualMachineSnapshot) (total int, running int, cpuPercent float64, memoryBytes uint64) {
	for _, vm := range vms {
		total++
		if vm.Running {
			running++
		}
		cpuPercent += vm.CPUPercent
		memoryBytes += vmMemoryUsageBytes(vm)
	}
	return total, running, cpuPercent, memoryBytes
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

func virtualMachineContainerAttribute(vm model.VirtualMachineSnapshot) map[string]any {
	return map[string]any{
		"name":                   vm.Name,
		"container":              vm.Name,
		"container_slug":         slugify(vm.UGOSVMID),
		"container_id":           vm.UGOSVMID,
		"project":                "Virtual machines",
		"project_slug":           slugify("Virtual machines"),
		"image":                  firstNonEmpty(vm.SourceName, vm.ISOPath, "Virtual Machine"),
		"cpu_usage_percent":      vm.CPUPercent,
		"memory_usage_bytes":     vmMemoryUsageBytes(vm),
		"memory_current_bytes":   vm.MemoryBytes,
		"memory_limit_bytes":     vm.MaxMemoryBytes,
		"memory_available_bytes": vm.MemoryAvailBytes,
		"memory_unused_bytes":    vm.MemoryUnusedBytes,
		"memory_rss_bytes":       vm.MemoryRSSBytes,
		"running":                boolToInt(vm.Running),
		"state":                  vm.State,
		"status":                 vmStatus(vm),
		"ugos_vm_id":             vm.UGOSVMID,
		"source_name":            vm.SourceName,
		"iso_path":               vm.ISOPath,
		"disk_paths":             vm.DiskPaths,
		"vcpus":                  vm.VCPUs,
		"disk_read_bytes":        vm.DiskReadBytes,
		"disk_write_bytes":       vm.DiskWriteBytes,
		"network_rx_bytes":       vm.NetworkRxBytes,
		"network_tx_bytes":       vm.NetworkTxBytes,
	}
}

func vmStatus(vm model.VirtualMachineSnapshot) string {
	if vm.State == "" || vm.State == "unknown" {
		return "Unavailable"
	}
	return strings.ToUpper(vm.State[:1]) + vm.State[1:]
}

func displaySourceName(source string) string {
	value := strings.TrimSpace(source)
	if value == "" {
		return "Health"
	}
	return strings.ToUpper(value[:1]) + value[1:]
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}
