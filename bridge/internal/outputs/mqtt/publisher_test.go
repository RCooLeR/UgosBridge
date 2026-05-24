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

func TestPublishSnapshotClearsDiscoveryWithoutClearingState(t *testing.T) {
	client := &recordingClient{connectionOpen: true}
	publisher := &MQTTPublisher{
		client: client,
		cfg: MQTTConfig{
			QoS:    1,
			Retain: true,
		},
		discoveredEntities: map[string]publishedEntity{
			"process:python:cpu": {
				discoveryTopic: "homeassistant/sensor/ugos_bridge_process_python/cpu_usage_percent/config",
				stateTopic:     "ugos_bridge/host/processes/python/state",
			},
		},
	}

	if err := publisher.PublishSnapshot(model.Snapshot{}); err != nil {
		t.Fatalf("PublishSnapshot returned error: %v", err)
	}

	if got := len(client.publishes); got != 1 {
		t.Fatalf("expected 1 publish, got %d", got)
	}

	msg := client.publishes[0]
	if msg.topic != "homeassistant/sensor/ugos_bridge_process_python/cpu_usage_percent/config" {
		t.Fatalf("unexpected discovery topic: %s", msg.topic)
	}
	if msg.payload != "" {
		t.Fatalf("expected empty discovery payload, got %q", msg.payload)
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

	state := configPayload(t, client, "ugos_bridge/host/ups/ups/state")
	if state["battery_charge_percent"] != float64(97) {
		t.Fatalf("battery charge payload = %#v, want 97", state["battery_charge_percent"])
	}
	if state["online"] != float64(1) {
		t.Fatalf("online payload = %#v, want 1", state["online"])
	}

	charge := configPayload(t, client, publisher.discoveryTopic("sensor", "ups_ups", "battery_charge_percent"))
	if viaDevice(t, charge) != "ugos_bridge_host_dxp6800_pro" {
		t.Fatalf("UPS charge via_device = %q, want host parent", viaDevice(t, charge))
	}

	online := configPayload(t, client, publisher.discoveryTopic("binary_sensor", "ups_ups", "online"))
	if online["value_template"] != "{{ value_json.online }}" {
		t.Fatalf("online value_template = %#v", online["value_template"])
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
