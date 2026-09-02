package mqttoutput

import (
	"encoding/json"
	"errors"
	"fmt"
	"reflect"
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
	failTopic      string
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
	if topic == c.failTopic {
		return stubToken{err: errors.New("forced publish failure")}
	}
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

type stubToken struct {
	err error
}

func (stubToken) Wait() bool { return true }

func (stubToken) WaitTimeout(time.Duration) bool { return true }

func (stubToken) Done() <-chan struct{} {
	done := make(chan struct{})
	close(done)
	return done
}

func (t stubToken) Error() error { return t.err }

func markConnectionCommitted(publisher *MQTTPublisher) {
	publisher.connectionGeneration.Store(1)
	publisher.replayReadyGeneration.Store(1)
	publisher.committedGeneration.Store(1)
}

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

func TestPublishSnapshotCommitsAvailabilityAfterFullReplay(t *testing.T) {
	client := &recordingClient{connectionOpen: true}
	publisher := &MQTTPublisher{
		client:             client,
		cfg:                MQTTConfig{TopicPrefix: "ugos_bridge", DiscoveryPrefix: "homeassistant", QoS: 1, Retain: true},
		availabilityTopic:  "ugos_bridge/status",
		availabilityOnline: "online_generation",
		discoveredEntities: map[string]publishedEntity{},
		lastPayloads:       map[string]string{},
		preparedPayloads:   map[string]preparedPayload{},
	}
	publisher.beginAvailabilityReplay(client)

	snapshot := model.Snapshot{
		Host: &model.HostSnapshot{
			Name:   "dxp6800_pro",
			CPU:    model.HostCPUSnapshot{UsagePercent: 12.5, Load1: 5.29},
			Memory: model.HostMemorySnapshot{UsedBytes: 40, TotalBytes: 100},
		},
	}
	if err := publisher.PublishSnapshot(snapshot); err != nil {
		t.Fatalf("PublishSnapshot returned error: %v", err)
	}

	if len(client.publishes) < 3 {
		t.Fatalf("expected availability barrier, entity replay, and commit, got %#v", client.publishes)
	}
	if first := client.publishes[0]; first.topic != publisher.availabilityTopic || first.payload != "offline" {
		t.Fatalf("first publish = %#v, want retained offline barrier", first)
	}
	last := client.publishes[len(client.publishes)-1]
	if last.topic != publisher.availabilityTopic || last.payload != publisher.availablePayload() || !last.retained {
		t.Fatalf("last publish = %#v, want retained availability commit", last)
	}
	for _, message := range client.publishes[:len(client.publishes)-1] {
		if message.topic == publisher.availabilityTopic && message.payload == publisher.availablePayload() {
			t.Fatalf("availability was committed before the entity replay completed: %#v", message)
		}
	}
	cpuDiscovery := configPayload(t, client, publisher.discoveryTopic("sensor", "host_dxp6800_pro", "cpu_usage_percent"))
	availability, ok := cpuDiscovery["availability"].([]any)
	if !ok || len(availability) == 0 {
		t.Fatalf("CPU discovery availability = %#v", cpuDiscovery["availability"])
	}
	globalAvailability, ok := availability[0].(map[string]any)
	if !ok || globalAvailability["payload_available"] != publisher.availablePayload() {
		t.Fatalf("CPU discovery global availability = %#v", availability[0])
	}
	if got := publisher.committedGeneration.Load(); got != publisher.connectionGeneration.Load() {
		t.Fatalf("committed generation = %d, connection generation = %d", got, publisher.connectionGeneration.Load())
	}

	client.publishes = nil
	if err := publisher.PublishSnapshot(snapshot); err != nil {
		t.Fatalf("unchanged PublishSnapshot returned error: %v", err)
	}
	if got := len(client.publishes); got != 0 {
		t.Fatalf("unchanged snapshot produced %d publishes after replay: %#v", got, client.publishes)
	}
}

func TestPublishSnapshotRetriesEntireReplayWhenAvailabilityCommitFails(t *testing.T) {
	client := &recordingClient{connectionOpen: true}
	publisher := &MQTTPublisher{
		client:             client,
		cfg:                MQTTConfig{TopicPrefix: "ugos_bridge", DiscoveryPrefix: "homeassistant", Retain: true},
		availabilityTopic:  "ugos_bridge/status",
		availabilityOnline: "online_generation",
		discoveredEntities: map[string]publishedEntity{},
		lastPayloads:       map[string]string{},
		preparedPayloads:   map[string]preparedPayload{},
	}
	publisher.beginAvailabilityReplay(client)
	client.publishes = nil
	client.failTopic = publisher.availabilityTopic

	snapshot := model.Snapshot{Projects: []model.ProjectSnapshot{{Name: "apps", TotalContainers: 1}}}
	if err := publisher.PublishSnapshot(snapshot); err == nil {
		t.Fatal("expected availability commit failure")
	}
	if got := publisher.committedGeneration.Load(); got != 0 {
		t.Fatalf("failed replay committed generation %d", got)
	}

	client.failTopic = ""
	client.publishes = nil
	if err := publisher.PublishSnapshot(snapshot); err != nil {
		t.Fatalf("replayed PublishSnapshot returned error: %v", err)
	}
	if len(client.publishes) == 0 {
		t.Fatal("expected full replay after failed availability commit")
	}
	last := client.publishes[len(client.publishes)-1]
	if last.topic != publisher.availabilityTopic || last.payload != publisher.availablePayload() {
		t.Fatalf("last retry publish = %#v, want availability commit", last)
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
	markConnectionCommitted(publisher)

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

func TestContainerCPUDiscoverySuggestsPrecisionWithoutRoundingState(t *testing.T) {
	const cpuPercent = 0.0736593591905565

	client := &recordingClient{connectionOpen: true}
	publisher := &MQTTPublisher{
		client:             client,
		cfg:                MQTTConfig{TopicPrefix: "ugos_bridge", DiscoveryPrefix: "homeassistant", Retain: true},
		availabilityTopic:  "ugos_bridge/status",
		discoveredEntities: map[string]publishedEntity{},
	}
	snapshot := model.Snapshot{Containers: []model.ContainerSnapshot{{
		ID:         "16ca4042b456",
		Name:       "ugos-bridge",
		Project:    "ugos-bridge",
		Running:    true,
		CPUPercent: cpuPercent,
	}}}

	if err := publisher.publishContainers(snapshot, map[string]publishedEntity{}); err != nil {
		t.Fatalf("publishContainers returned error: %v", err)
	}

	cpu := configPayload(t, client, publisher.discoveryTopic("sensor", "container_ugos_bridge", "cpu_usage_percent"))
	if got := cpu["suggested_display_precision"]; got != float64(2) {
		t.Fatalf("CPU suggested_display_precision = %#v, want 2", got)
	}

	state := messagePayload(t, client, "ugos_bridge/containers/ugos_bridge/cpu_usage_percent/state")
	var gotCPUPercent float64
	if err := json.Unmarshal([]byte(state), &gotCPUPercent); err != nil {
		t.Fatalf("unmarshal CPU state %q: %v", state, err)
	}
	if gotCPUPercent != cpuPercent {
		t.Fatalf("CPU state = %.17g, want unrounded %.17g", gotCPUPercent, cpuPercent)
	}

	running := configPayload(t, client, publisher.discoveryTopic("sensor", "container_ugos_bridge", "running"))
	if _, ok := running["suggested_display_precision"]; ok {
		t.Fatalf("integral running sensor should omit suggested_display_precision")
	}
}

func TestSensorDefinitionsUseExpectedDisplayPrecision(t *testing.T) {
	definitionGroups := map[string]map[string]sensorDefinition{
		"project":    projectSensors,
		"container":  containerSensors,
		"vm":         vmSensors,
		"host":       hostSensors,
		"process":    processSensors,
		"filesystem": filesystemSensors,
		"disk":       diskSensors,
		"network":    networkSensors,
		"bond":       bondSensors,
		"bond_slave": bondSlaveSensors,
		"array":      arraySensors,
		"gpu":        gpuSensors,
		"health":     healthSensors,
		"cooling":    coolingSensors,
		"ups":        upsSensors,
	}
	expected := map[string]int{
		"project/cpu":         2,
		"container/cpu":       2,
		"vm/cpu":              2,
		"host/cpu":            2,
		"host/cpufreq":        0,
		"host/load1":          2,
		"host/memorypct":      1,
		"host/swappct":        1,
		"host/uptime":         0,
		"process/cpu":         2,
		"process/cpu_time":    2,
		"filesystem/used_pct": 1,
		"disk/read_bps":       0,
		"disk/write_bps":      0,
		"disk/busy":           1,
		"network/rx_bps":      0,
		"network/tx_bps":      0,
		"array/sync":          1,
		"gpu/busy":            1,
		"health/temperature":  1,
		"health/fan":          0,
		"cooling/percent":     1,
		"ups/charge":          0,
		"ups/runtime":         0,
		"ups/battery_volt":    1,
		"ups/input_volt":      1,
		"ups/output_volt":     1,
		"ups/load":            0,
		"ups/power":           0,
		"ups/nominal_power":   0,
		"ups/frequency":       1,
		"ups/temperature":     1,
	}
	seen := make(map[string]bool, len(expected))

	for group, definitions := range definitionGroups {
		for key, definition := range definitions {
			name := group + "/" + key
			want, ok := expected[name]
			if !ok {
				if definition.SuggestedDisplayPrecision != nil {
					t.Errorf("%s has unexpected suggested display precision %d", name, *definition.SuggestedDisplayPrecision)
				}
				continue
			}
			seen[name] = true
			if definition.SuggestedDisplayPrecision == nil {
				t.Errorf("%s has no suggested display precision, want %d", name, want)
				continue
			}
			if got := *definition.SuggestedDisplayPrecision; got != want {
				t.Errorf("%s suggested display precision = %d, want %d", name, got, want)
			}
		}
	}

	for name := range expected {
		if !seen[name] {
			t.Errorf("expected display precision definition %s was not found", name)
		}
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
	markConnectionCommitted(publisher)
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

func TestContainerEntityIdentityDoesNotUseRuntimeID(t *testing.T) {
	publishContainer := func(runtimeID string) (map[string]any, map[string]any) {
		client := &recordingClient{connectionOpen: true}
		publisher := &MQTTPublisher{
			client:             client,
			cfg:                MQTTConfig{TopicPrefix: "ugos_bridge", DiscoveryPrefix: "homeassistant", Retain: true},
			availabilityTopic:  "ugos_bridge/status",
			discoveredEntities: map[string]publishedEntity{},
		}
		snapshot := model.Snapshot{Containers: []model.ContainerSnapshot{{
			ID:               runtimeID,
			Name:             "home-assistant",
			Project:          "home",
			Image:            "ghcr.io/home-assistant/home-assistant:stable",
			Running:          true,
			CPUPercent:       2.5,
			MemoryUsageBytes: 1024,
		}}}
		if err := publisher.publishContainers(snapshot, map[string]publishedEntity{}); err != nil {
			t.Fatalf("publishContainers returned error: %v", err)
		}

		discovery := configPayload(t, client, publisher.discoveryTopic("sensor", "container_home_assistant", "cpu_usage_percent"))
		attributes := configPayload(t, client, "ugos_bridge/containers/home_assistant/attributes")
		return discovery, attributes
	}

	firstDiscovery, firstAttributes := publishContainer("111111111111aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
	secondDiscovery, secondAttributes := publishContainer("222222222222bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")
	if !reflect.DeepEqual(firstDiscovery, secondDiscovery) {
		t.Fatalf("container discovery changed with runtime ID:\nfirst:  %#v\nsecond: %#v", firstDiscovery, secondDiscovery)
	}
	if firstAttributes["container_id"] == secondAttributes["container_id"] {
		t.Fatalf("container attributes did not report the changed runtime ID: %#v", firstAttributes)
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
	if got := charge["suggested_display_precision"]; got != float64(0) {
		t.Fatalf("UPS charge suggested_display_precision = %#v, want 0", got)
	}

	status := configPayload(t, client, publisher.discoveryTopic("sensor", "ups_ups", "status"))
	if _, ok := status["suggested_display_precision"]; ok {
		t.Fatalf("UPS status should omit suggested_display_precision")
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
