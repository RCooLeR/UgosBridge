package mqttoutput

import (
	"encoding/json"
	"fmt"
	"strings"
	"testing"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"

	"github.com/RCooLeR/UgosBridge/bridge/internal/model"
)

type publishedMessage struct {
	topic    string
	qos      byte
	retained bool
	payload  string
}

type recordingClient struct {
	connectionOpen bool
	publishes      []publishedMessage
}

func (c *recordingClient) IsConnected() bool { return true }

func (c *recordingClient) IsConnectionOpen() bool { return c.connectionOpen }

func (c *recordingClient) Connect() mqtt.Token { return stubToken{} }

func (c *recordingClient) Disconnect(quiesce uint) {}

func (c *recordingClient) Publish(topic string, qos byte, retained bool, payload interface{}) mqtt.Token {
	c.publishes = append(c.publishes, publishedMessage{
		topic:    topic,
		qos:      qos,
		retained: retained,
		payload:  payloadString(payload),
	})
	return stubToken{}
}

func (c *recordingClient) Subscribe(topic string, qos byte, callback mqtt.MessageHandler) mqtt.Token {
	return stubToken{}
}

func (c *recordingClient) SubscribeMultiple(filters map[string]byte, callback mqtt.MessageHandler) mqtt.Token {
	return stubToken{}
}

func (c *recordingClient) Unsubscribe(topics ...string) mqtt.Token { return stubToken{} }

func (c *recordingClient) AddRoute(topic string, callback mqtt.MessageHandler) {}

func (c *recordingClient) OptionsReader() mqtt.ClientOptionsReader {
	return mqtt.NewOptionsReader(mqtt.NewClientOptions())
}

type stubToken struct{}

func (stubToken) Wait() bool { return true }

func (stubToken) WaitTimeout(time.Duration) bool { return true }

func (stubToken) Done() <-chan struct{} {
	done := make(chan struct{})
	close(done)
	return done
}

func (stubToken) Error() error { return nil }

func TestPublishSnapshotReturnsWhenConnectionIsNotOpen(t *testing.T) {
	client := &recordingClient{}
	publisher := &MQTTPublisher{
		client: client,
		cfg: MQTTConfig{
			Broker: "tcp://mqtt:1883",
			QoS:    1,
			Retain: true,
		},
		discoveredEntities: map[string]publishedEntity{},
	}

	err := publisher.PublishSnapshot(model.Snapshot{
		Projects: []model.ProjectSnapshot{{Name: "apps"}},
	})
	if err == nil {
		t.Fatal("expected error when MQTT connection is not open")
	}
	if !strings.Contains(err.Error(), "is not connected") {
		t.Fatalf("unexpected error: %v", err)
	}
	if got := len(client.publishes); got != 0 {
		t.Fatalf("expected no publishes, got %d", got)
	}
}

func TestPublishSnapshotUsesUnavailableGraceBeforeRemovingDiscovery(t *testing.T) {
	client := &recordingClient{connectionOpen: true}
	publisher := &MQTTPublisher{
		client: client,
		cfg: MQTTConfig{
			QoS:              1,
			Retain:           true,
			UnavailableAfter: 3,
			RemoveAfter:      5,
		},
		discoveredEntities: map[string]publishedEntity{
			"process:python:cpu": {
				discoveryTopic:    "homeassistant/sensor/ugos_bridge_process_python/cpu_usage_percent/config",
				stateTopic:        "ugos_bridge/host/processes/python/cpu_usage_percent/state",
				availabilityTopic: "ugos_bridge/host/processes/python/cpu_usage_percent/availability",
			},
		},
	}

	for poll := 1; poll <= 2; poll++ {
		if err := publisher.PublishSnapshot(model.Snapshot{}); err != nil {
			t.Fatalf("PublishSnapshot poll %d returned error: %v", poll, err)
		}
	}
	if got := len(client.publishes); got != 0 {
		t.Fatalf("expected no publishes during grace period, got %d", got)
	}

	if err := publisher.PublishSnapshot(model.Snapshot{}); err != nil {
		t.Fatalf("PublishSnapshot unavailable poll returned error: %v", err)
	}
	if got := len(client.publishes); got != 1 {
		t.Fatalf("expected one unavailable publish, got %d", got)
	}
	if msg := client.publishes[0]; msg.topic != "ugos_bridge/host/processes/python/cpu_usage_percent/availability" || msg.payload != "offline" {
		t.Fatalf("unexpected unavailable publish: %#v", msg)
	}

	if err := publisher.PublishSnapshot(model.Snapshot{}); err != nil {
		t.Fatalf("PublishSnapshot fourth poll returned error: %v", err)
	}
	if err := publisher.PublishSnapshot(model.Snapshot{}); err != nil {
		t.Fatalf("PublishSnapshot removal poll returned error: %v", err)
	}
	if got := len(client.publishes); got != 4 {
		t.Fatalf("expected unavailable plus 3 retained cleanup publishes, got %d", got)
	}
	if msg := client.publishes[1]; msg.topic != "homeassistant/sensor/ugos_bridge_process_python/cpu_usage_percent/config" || msg.payload != "" {
		t.Fatalf("unexpected discovery cleanup publish: %#v", msg)
	}
}

func TestHealthSensorsUseUniqueEntityIDsPerSensor(t *testing.T) {
	client := &recordingClient{connectionOpen: true}
	publisher := &MQTTPublisher{
		client:             client,
		cfg:                MQTTConfig{TopicPrefix: "ugos_bridge", DiscoveryPrefix: "homeassistant"},
		availabilityTopic:  "ugos_bridge/status",
		discoveredEntities: map[string]publishedEntity{},
	}

	snapshot := model.Snapshot{
		CollectedAt: time.Date(2026, 4, 27, 23, 30, 0, 0, time.UTC),
		Host: &model.HostSnapshot{
			Name: "dxp6800_pro",
			Sensors: []model.SensorSnapshot{
				{Source: "hwmon", Chip: "coretemp", Name: "core_0", Label: "Core 0", Kind: "temperature", Value: 50},
				{Source: "hwmon", Chip: "coretemp", Name: "core_1", Label: "Core 1", Kind: "temperature", Value: 51},
			},
		},
	}

	if err := publisher.publishHost(snapshot, map[string]publishedEntity{}); err != nil {
		t.Fatalf("publishHost returned error: %v", err)
	}

	first := configPayload(t, client, publisher.discoveryTopic("sensor", "hwmon_coretemp_core_0", "temperature_celsius"))
	second := configPayload(t, client, publisher.discoveryTopic("sensor", "hwmon_coretemp_core_1", "temperature_celsius"))

	if first["unique_id"] == second["unique_id"] {
		t.Fatalf("expected unique IDs to differ, got %v", first["unique_id"])
	}
	if first["object_id"] == second["object_id"] {
		t.Fatalf("expected object IDs to differ, got %v", first["object_id"])
	}
}

func TestHostLoadSensorUsesPercentUnit(t *testing.T) {
	client := &recordingClient{connectionOpen: true}
	publisher := &MQTTPublisher{
		client:             client,
		cfg:                MQTTConfig{TopicPrefix: "ugos_bridge", DiscoveryPrefix: "homeassistant"},
		availabilityTopic:  "ugos_bridge/status",
		discoveredEntities: map[string]publishedEntity{},
	}

	snapshot := model.Snapshot{
		CollectedAt: time.Date(2026, 4, 27, 23, 30, 0, 0, time.UTC),
		Host: &model.HostSnapshot{
			Name: "dxp6800_pro",
			CPU:  model.HostCPUSnapshot{Load1: 5.29},
		},
	}

	if err := publisher.publishHost(snapshot, map[string]publishedEntity{}); err != nil {
		t.Fatalf("publishHost returned error: %v", err)
	}

	load := configPayload(t, client, publisher.discoveryTopic("sensor", "host_dxp6800_pro", "load_1"))
	if load["unit_of_measurement"] != "%" {
		t.Fatalf("load unit = %#v, want %%", load["unit_of_measurement"])
	}
}

func TestDiscoveryUsesScalarStateAndCompactAttributes(t *testing.T) {
	client := &recordingClient{connectionOpen: true}
	publisher := &MQTTPublisher{
		client:             client,
		cfg:                MQTTConfig{TopicPrefix: "ugos_bridge", DiscoveryPrefix: "homeassistant", Retain: true},
		availabilityTopic:  "ugos_bridge/status",
		discoveredEntities: map[string]publishedEntity{},
	}
	snapshot := model.Snapshot{
		CollectedAt: time.Date(2026, 4, 27, 23, 30, 0, 0, time.UTC),
		Host: &model.HostSnapshot{
			Name: "dxp6800_pro",
			CPU: model.HostCPUSnapshot{
				UsagePercent: 12.5,
				Load1:        5.29,
				CoreUsage:    []model.CPUCoreSnapshot{{Name: "cpu0", UsagePercent: 10}},
			},
			Memory: model.HostMemorySnapshot{UsedBytes: 40, TotalBytes: 100},
		},
	}

	if err := publisher.publishHost(snapshot, map[string]publishedEntity{}); err != nil {
		t.Fatalf("publishHost returned error: %v", err)
	}

	cpu := configPayload(t, client, publisher.discoveryTopic("sensor", "host_dxp6800_pro", "cpu_usage_percent"))
	if cpu["state_topic"] != "ugos_bridge/host/cpu_usage_percent/state" {
		t.Fatalf("CPU state_topic = %#v", cpu["state_topic"])
	}
	if cpu["json_attributes_topic"] != "ugos_bridge/host/attributes" {
		t.Fatalf("CPU json_attributes_topic = %#v", cpu["json_attributes_topic"])
	}
	if _, ok := cpu["value_template"]; ok {
		t.Fatalf("scalar sensor should not have value_template")
	}
	if _, ok := cpu["expire_after"]; ok {
		t.Fatalf("change-only sensor should not have expire_after")
	}

	load := configPayload(t, client, publisher.discoveryTopic("sensor", "host_dxp6800_pro", "load_1"))
	if _, ok := load["json_attributes_topic"]; ok {
		t.Fatalf("load sensor should not duplicate host attributes")
	}

	attributes := configPayload(t, client, "ugos_bridge/host/attributes")
	if _, ok := attributes["collected_at"]; ok {
		t.Fatalf("attributes must not include collected_at")
	}
	if _, ok := attributes["cpu_usage_percent"]; ok {
		t.Fatalf("attributes must not contain the full host state payload")
	}
	if _, ok := attributes["load_1"]; ok {
		t.Fatalf("attributes must not contain sibling entity state")
	}
}

func TestPublishSnapshotOnlyPublishesChangedEntityState(t *testing.T) {
	client := &recordingClient{connectionOpen: true}
	publisher := &MQTTPublisher{
		client:             client,
		cfg:                MQTTConfig{TopicPrefix: "ugos_bridge", DiscoveryPrefix: "homeassistant", Retain: true},
		availabilityTopic:  "ugos_bridge/status",
		discoveredEntities: map[string]publishedEntity{},
	}
	snapshot := model.Snapshot{
		CollectedAt: time.Date(2026, 4, 27, 23, 30, 0, 0, time.UTC),
		Host: &model.HostSnapshot{
			Name:   "dxp6800_pro",
			CPU:    model.HostCPUSnapshot{UsagePercent: 12.5, Load1: 5.29},
			Memory: model.HostMemorySnapshot{UsedBytes: 40, TotalBytes: 100},
		},
	}

	if err := publisher.PublishSnapshot(snapshot); err != nil {
		t.Fatalf("first PublishSnapshot returned error: %v", err)
	}
	client.publishes = nil

	snapshot.CollectedAt = snapshot.CollectedAt.Add(time.Minute)
	if err := publisher.PublishSnapshot(snapshot); err != nil {
		t.Fatalf("unchanged PublishSnapshot returned error: %v", err)
	}
	if got := len(client.publishes); got != 0 {
		t.Fatalf("unchanged useful values produced %d MQTT publishes: %#v", got, client.publishes)
	}

	snapshot.Host.CPU.UsagePercent = 13.5
	if err := publisher.PublishSnapshot(snapshot); err != nil {
		t.Fatalf("changed PublishSnapshot returned error: %v", err)
	}
	if got := len(client.publishes); got != 1 {
		t.Fatalf("one changed entity produced %d MQTT publishes: %#v", got, client.publishes)
	}
	if topic := client.publishes[0].topic; topic != "ugos_bridge/host/cpu_usage_percent/state" {
		t.Fatalf("changed publish topic = %q", topic)
	}
}

func TestProcessEntitiesRequireAllowlist(t *testing.T) {
	snapshot := model.Snapshot{
		Host: &model.HostSnapshot{
			Name: "dxp6800_pro",
			Processes: []model.ProcessSnapshot{
				{Name: "Search Serv", CPUPercent: 100},
				{Name: "dockerd", CPUPercent: 2},
			},
		},
	}

	disabledClient := &recordingClient{connectionOpen: true}
	disabled := &MQTTPublisher{
		client:             disabledClient,
		cfg:                MQTTConfig{TopicPrefix: "ugos_bridge", DiscoveryPrefix: "homeassistant"},
		availabilityTopic:  "ugos_bridge/status",
		discoveredEntities: map[string]publishedEntity{},
	}
	if err := disabled.publishHost(snapshot, map[string]publishedEntity{}); err != nil {
		t.Fatalf("publishHost without allowlist returned error: %v", err)
	}
	if hasTopic(disabledClient, disabled.discoveryTopic("sensor", "process_search_serv", "cpu_usage_percent")) {
		t.Fatalf("process entity was published without an allowlist")
	}
	attributes := configPayload(t, disabledClient, "ugos_bridge/host/attributes")
	topProcesses, ok := attributes["top_processes"].([]any)
	if !ok || len(topProcesses) != 2 {
		t.Fatalf("top_processes = %#v, want two compact entries", attributes["top_processes"])
	}
	first, ok := topProcesses[0].(map[string]any)
	if !ok || first["name"] != "Search Serv" || first["cpu_usage_percent"] != float64(100) {
		t.Fatalf("first top process = %#v", topProcesses[0])
	}

	allowedClient := &recordingClient{connectionOpen: true}
	allowed := &MQTTPublisher{
		client: allowedClient,
		cfg: MQTTConfig{
			TopicPrefix:      "ugos_bridge",
			DiscoveryPrefix:  "homeassistant",
			ProcessAllowlist: []string{"search_serv"},
		},
		availabilityTopic:  "ugos_bridge/status",
		discoveredEntities: map[string]publishedEntity{},
	}
	if err := allowed.publishHost(snapshot, map[string]publishedEntity{}); err != nil {
		t.Fatalf("publishHost with allowlist returned error: %v", err)
	}
	if !hasTopic(allowedClient, allowed.discoveryTopic("sensor", "process_search_serv", "cpu_usage_percent")) {
		t.Fatalf("allowlisted process entity was not published")
	}
	if hasTopic(allowedClient, allowed.discoveryTopic("sensor", "process_dockerd", "cpu_usage_percent")) {
		t.Fatalf("non-allowlisted process entity was published")
	}
}

func TestDiskAndDiskSensorIdentityUseSerial(t *testing.T) {
	client := &recordingClient{connectionOpen: true}
	publisher := &MQTTPublisher{
		client:             client,
		cfg:                MQTTConfig{TopicPrefix: "ugos_bridge", DiscoveryPrefix: "homeassistant"},
		availabilityTopic:  "ugos_bridge/status",
		discoveredEntities: map[string]publishedEntity{},
	}
	snapshot := model.Snapshot{
		Host: &model.HostSnapshot{
			Name: "dxp6800_pro",
			Disks: []model.DiskSnapshot{
				{Name: "nvme0n1", Serial: "DISK-A", Path: "/devices/pci-a", SizeBytes: 100},
				{Name: "nvme1n1", Serial: "DISK-B", Path: "/devices/pci-b", SizeBytes: 200},
			},
			Sensors: []model.SensorSnapshot{
				{Source: "hwmon", Chip: "nvme", Name: "temp1", Label: "Composite", Kind: "temperature", Value: 40, DeviceType: "disk", DeviceName: "nvme0n1"},
				{Source: "hwmon", Chip: "nvme", Name: "temp1", Label: "Composite", Kind: "temperature", Value: 41, DeviceType: "disk", DeviceName: "nvme1n1"},
			},
		},
	}

	if err := publisher.publishHost(snapshot, map[string]publishedEntity{}); err != nil {
		t.Fatalf("publishHost returned error: %v", err)
	}

	diskA := configPayload(t, client, publisher.discoveryTopic("sensor", "disk_serial_disk_a", "size_bytes"))
	diskB := configPayload(t, client, publisher.discoveryTopic("sensor", "disk_serial_disk_b", "size_bytes"))
	if diskA["unique_id"] == diskB["unique_id"] {
		t.Fatalf("physical disks share unique_id %q", diskA["unique_id"])
	}

	tempA := configPayload(t, client, publisher.discoveryTopic("sensor", "hwmon_serial_disk_a_nvme_temp1", "temperature_celsius"))
	tempB := configPayload(t, client, publisher.discoveryTopic("sensor", "hwmon_serial_disk_b_nvme_temp1", "temperature_celsius"))
	if tempA["unique_id"] == tempB["unique_id"] {
		t.Fatalf("NVMe sensors share unique_id %q", tempA["unique_id"])
	}
	legacyCleanup := publishedForTopic(t, client, publisher.discoveryTopic("sensor", "disk_nvme0n1", "size_bytes"))
	if legacyCleanup.payload != "" || !legacyCleanup.retained {
		t.Fatalf("legacy disk discovery cleanup = %#v", legacyCleanup)
	}

	renamed := model.DiskSnapshot{Name: "nvme2n1", Serial: "DISK-A", Path: "/devices/pci-a"}
	if got := diskIdentitySlug(renamed); got != "serial_disk_a" {
		t.Fatalf("renamed disk identity = %q, want serial_disk_a", got)
	}
	pathOnlyA := diskIdentitySlug(model.DiskSnapshot{Name: "sda", Path: "/devices/pci-a/target-1"})
	pathOnlyB := diskIdentitySlug(model.DiskSnapshot{Name: "sdf", Path: "/devices/pci-a/target-1"})
	if pathOnlyA != pathOnlyB || !strings.HasPrefix(pathOnlyA, "path_") {
		t.Fatalf("path fallback identities = %q and %q", pathOnlyA, pathOnlyB)
	}
}

func TestUPSPublishesHomeAssistantEntities(t *testing.T) {
	client := &recordingClient{connectionOpen: true}
	publisher := &MQTTPublisher{
		client:             client,
		cfg:                MQTTConfig{TopicPrefix: "ugos_bridge", DiscoveryPrefix: "homeassistant"},
		availabilityTopic:  "ugos_bridge/status",
		discoveredEntities: map[string]publishedEntity{},
	}

	snapshot := model.Snapshot{
		CollectedAt: time.Date(2026, 4, 27, 23, 30, 0, 0, time.UTC),
		Host: &model.HostSnapshot{
			Name: "dxp6800_pro",
			UPSs: []model.UPSSnapshot{
				{
					Name:                   "ups",
					Manufacturer:           "APC",
					Model:                  "Back-UPS",
					Serial:                 "ABC123",
					Status:                 "OL CHRG",
					Online:                 true,
					BatteryChargePercent:   97,
					BatteryChargeAvailable: true,
					LoadPercent:            18,
					LoadPercentAvailable:   true,
				},
			},
		},
	}

	if err := publisher.publishHost(snapshot, map[string]publishedEntity{}); err != nil {
		t.Fatalf("publishHost returned error: %v", err)
	}

	if state := messagePayload(t, client, "ugos_bridge/host/ups/ups/battery_charge_percent/state"); state != "97" {
		t.Fatalf("battery charge payload = %q, want 97", state)
	}
	if state := messagePayload(t, client, "ugos_bridge/host/ups/ups/online/state"); state != "1" {
		t.Fatalf("online payload = %q, want 1", state)
	}

	charge := configPayload(t, client, publisher.discoveryTopic("sensor", "ups_ups", "battery_charge_percent"))
	if viaDevice(t, charge) != "ugos_bridge_host_dxp6800_pro" {
		t.Fatalf("UPS charge via_device = %q, want host parent", viaDevice(t, charge))
	}
	if charge["state_topic"] != "ugos_bridge/host/ups/ups/battery_charge_percent/state" {
		t.Fatalf("UPS charge state_topic = %#v", charge["state_topic"])
	}

	online := configPayload(t, client, publisher.discoveryTopic("binary_sensor", "ups_ups", "online"))
	if _, ok := online["value_template"]; ok {
		t.Fatalf("binary sensor should consume a scalar state, got value_template = %#v", online["value_template"])
	}
}

func TestBondSlaveEntitiesDoNotReuseNetworkEntityIDs(t *testing.T) {
	client := &recordingClient{connectionOpen: true}
	publisher := &MQTTPublisher{
		client:             client,
		cfg:                MQTTConfig{TopicPrefix: "ugos_bridge", DiscoveryPrefix: "homeassistant"},
		availabilityTopic:  "ugos_bridge/status",
		discoveredEntities: map[string]publishedEntity{},
	}

	snapshot := model.Snapshot{
		CollectedAt: time.Date(2026, 4, 27, 23, 30, 0, 0, time.UTC),
		Host: &model.HostSnapshot{
			Name: "dxp6800_pro",
			Networks: []model.NetworkSnapshot{
				{Name: "eth0", Master: "bond0", Carrier: true, SpeedMbps: 1000},
			},
			Bonds: []model.BondSnapshot{
				{
					Name:      "bond0",
					Carrier:   true,
					SpeedMbps: 2000,
					Slaves: []model.BondSlaveSnapshot{
						{Name: "eth0", Carrier: true, SpeedMbps: 1000, Active: true},
					},
				},
			},
		},
	}

	if err := publisher.publishHost(snapshot, map[string]publishedEntity{}); err != nil {
		t.Fatalf("publishHost returned error: %v", err)
	}

	networkSpeed := configPayload(t, client, publisher.discoveryTopic("sensor", "network_eth0", "speed_mbps"))
	slaveSpeed := configPayload(t, client, publisher.discoveryTopic("sensor", "bond_bond0_slave_eth0", "speed_mbps"))
	if networkSpeed["unique_id"] == slaveSpeed["unique_id"] {
		t.Fatalf("expected network and bond slave speed unique IDs to differ, got %v", networkSpeed["unique_id"])
	}

	networkCarrier := configPayload(t, client, publisher.discoveryTopic("binary_sensor", "network_eth0", "carrier"))
	slaveCarrier := configPayload(t, client, publisher.discoveryTopic("binary_sensor", "bond_bond0_slave_eth0", "carrier"))
	if networkCarrier["unique_id"] == slaveCarrier["unique_id"] {
		t.Fatalf("expected network and bond slave carrier unique IDs to differ, got %v", networkCarrier["unique_id"])
	}
}

func TestChildDeviceDiscoveryPublishesParentsFirst(t *testing.T) {
	client := &recordingClient{connectionOpen: true}
	publisher := &MQTTPublisher{
		client:             client,
		cfg:                MQTTConfig{TopicPrefix: "ugos_bridge", DiscoveryPrefix: "homeassistant"},
		availabilityTopic:  "ugos_bridge/status",
		discoveredEntities: map[string]publishedEntity{},
	}

	snapshot := model.Snapshot{
		CollectedAt: time.Date(2026, 4, 27, 23, 30, 0, 0, time.UTC),
		Host: &model.HostSnapshot{
			Name: "dxp6800_pro",
			Filesystems: []model.FilesystemSnapshot{
				{Name: "/volume1", Array: "md0", UsedBytes: 40, FreeBytes: 60, TotalBytes: 100},
			},
			Arrays: []model.ArraySnapshot{
				{Name: "md0", Level: "raid1", State: "clean", SizeBytes: 100, DisksActive: 2, DisksTotal: 2},
			},
			Networks: []model.NetworkSnapshot{
				{Name: "eth0", Master: "bond0", Carrier: true, SpeedMbps: 1000},
			},
			Bonds: []model.BondSnapshot{
				{Name: "bond0", Carrier: true, SpeedMbps: 1000},
			},
		},
	}

	if err := publisher.publishHost(snapshot, map[string]publishedEntity{}); err != nil {
		t.Fatalf("publishHost returned error: %v", err)
	}

	arrayTopic := publisher.discoveryTopic("sensor", "array_md0", "size_bytes")
	filesystemTopic := publisher.discoveryTopic("sensor", "filesystem_volume1", "used_bytes")
	if arrayIndex, filesystemIndex := publishIndex(t, client, arrayTopic), publishIndex(t, client, filesystemTopic); arrayIndex > filesystemIndex {
		t.Fatalf("array discovery published after filesystem discovery: array=%d filesystem=%d", arrayIndex, filesystemIndex)
	}

	bondTopic := publisher.discoveryTopic("sensor", "bond_bond0", "speed_mbps")
	networkTopic := publisher.discoveryTopic("sensor", "network_eth0", "speed_mbps")
	if bondIndex, networkIndex := publishIndex(t, client, bondTopic), publishIndex(t, client, networkTopic); bondIndex > networkIndex {
		t.Fatalf("bond discovery published after network discovery: bond=%d network=%d", bondIndex, networkIndex)
	}

	filesystem := configPayload(t, client, filesystemTopic)
	if viaDevice(t, filesystem) != "ugos_bridge_host_dxp6800_pro_array_md0" {
		t.Fatalf("filesystem via_device = %q, want array parent", viaDevice(t, filesystem))
	}

	network := configPayload(t, client, networkTopic)
	if viaDevice(t, network) != "ugos_bridge_host_dxp6800_pro_bond_bond0" {
		t.Fatalf("network via_device = %q, want bond parent", viaDevice(t, network))
	}
}

func configPayload(t *testing.T, client *recordingClient, topic string) map[string]any {
	t.Helper()

	for _, msg := range client.publishes {
		if msg.topic != topic {
			continue
		}

		var payload map[string]any
		if err := json.Unmarshal([]byte(msg.payload), &payload); err != nil {
			t.Fatalf("unmarshal payload for %s: %v", topic, err)
		}
		return payload
	}

	t.Fatalf("topic %s was not published", topic)
	return nil
}

func messagePayload(t *testing.T, client *recordingClient, topic string) string {
	t.Helper()

	for _, msg := range client.publishes {
		if msg.topic == topic {
			return msg.payload
		}
	}
	t.Fatalf("topic %s was not published", topic)
	return ""
}

func publishedForTopic(t *testing.T, client *recordingClient, topic string) publishedMessage {
	t.Helper()
	for _, msg := range client.publishes {
		if msg.topic == topic {
			return msg
		}
	}
	t.Fatalf("topic %s was not published", topic)
	return publishedMessage{}
}

func hasTopic(client *recordingClient, topic string) bool {
	for _, msg := range client.publishes {
		if msg.topic == topic {
			return true
		}
	}
	return false
}

func publishIndex(t *testing.T, client *recordingClient, topic string) int {
	t.Helper()

	for index, msg := range client.publishes {
		if msg.topic == topic {
			return index
		}
	}

	t.Fatalf("topic %s was not published", topic)
	return -1
}

func viaDevice(t *testing.T, payload map[string]any) string {
	t.Helper()

	device, ok := payload["device"].(map[string]any)
	if !ok {
		t.Fatalf("payload has no device map: %#v", payload["device"])
	}
	via, ok := device["via_device"].(string)
	if !ok {
		t.Fatalf("payload has no via_device string: %#v", device["via_device"])
	}
	return via
}

func TestVirtualMachineMemoryUsageIgnoresStoppedVMs(t *testing.T) {
	vms := []model.VirtualMachineSnapshot{
		{
			UGOSVMID:         "running-vm",
			Name:             "Running VM",
			Running:          true,
			CPUPercent:       2.5,
			MemoryBytes:      8 * 1024,
			MemoryUsageBytes: 3 * 1024,
			MaxMemoryBytes:   16 * 1024,
		},
		{
			UGOSVMID:         "stopped-vm",
			Name:             "Stopped VM",
			State:            "shutoff",
			Running:          false,
			CPUPercent:       9,
			MemoryBytes:      8 * 1024,
			MemoryUsageBytes: 4 * 1024,
			MaxMemoryBytes:   16 * 1024,
		},
	}

	total, running, _, memory := virtualMachineProjectTotals(vms)
	if total != 2 || running != 1 {
		t.Fatalf("unexpected VM totals: total=%d running=%d", total, running)
	}
	if memory != 3*1024 {
		t.Fatalf("expected project memory to include only running VM usage, got %d", memory)
	}

	stoppedAttrs := virtualMachineContainerAttribute(vms[1])
	if got := stoppedAttrs["memory_usage_bytes"]; got != uint64(0) {
		t.Fatalf("expected stopped VM memory_usage_bytes to be 0, got %#v", got)
	}
	if got := stoppedAttrs["memory_current_bytes"]; got != uint64(8*1024) {
		t.Fatalf("expected stopped VM current memory to stay available, got %#v", got)
	}
}

func payloadString(payload interface{}) string {
	switch value := payload.(type) {
	case string:
		return value
	case []byte:
		return string(value)
	default:
		return fmt.Sprint(value)
	}
}
