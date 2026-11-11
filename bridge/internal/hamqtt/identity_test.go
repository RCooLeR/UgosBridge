package hamqtt

import (
	"bytes"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/rs/zerolog"

	"github.com/RCooLeR/UgosBridge/bridge/internal/model"
)

func TestParseIdentityScope(t *testing.T) {
	for raw, want := range map[string]IdentityScope{"": IdentityScopeGlobal, "global": IdentityScopeGlobal, " Host ": IdentityScopeHost} {
		got, err := ParseIdentityScope(raw)
		if err != nil || got != want {
			t.Fatalf("ParseIdentityScope(%q) = %q, %v; want %q", raw, got, err, want)
		}
	}
	if _, err := ParseIdentityScope("node"); err == nil {
		t.Fatal("ParseIdentityScope(node) succeeded, want error")
	}
}

func TestApplyIdentityScopeNamespacesClientIDAndTopics(t *testing.T) {
	global := Config{ClientID: "ugos_bridge", TopicPrefix: "ugos_bridge", HostName: "cubie-a7a"}
	if got, err := applyIdentityScope(global); err != nil || got.ClientID != "ugos_bridge" || got.TopicPrefix != "ugos_bridge" {
		t.Fatalf("global scope changed names: %#v, %v", got, err)
	}

	for _, tc := range []struct {
		clientID, prefix         string
		wantClientID, wantPrefix string
	}{
		{"ugos-bridge", "ugos_bridge", "ugos-bridge-cubie_a7a", "ugos_bridge/cubie_a7a"},
		// A copied single-bridge configuration still gets its own names.
		{"ugos_bridge", "/ugos_bridge/", "ugos_bridge-cubie_a7a", "ugos_bridge/cubie_a7a"},
	} {
		got, err := applyIdentityScope(Config{ClientID: tc.clientID, TopicPrefix: tc.prefix, HostName: "cubie-a7a", IdentityScope: IdentityScopeHost})
		if err != nil {
			t.Fatalf("applyIdentityScope returned error: %v", err)
		}
		if got.ClientID != tc.wantClientID || got.TopicPrefix != tc.wantPrefix {
			t.Fatalf("host scope names = %q, %q; want %q, %q", got.ClientID, got.TopicPrefix, tc.wantClientID, tc.wantPrefix)
		}
	}

	for _, hostName := range []string{"", "  ", "Status", "virtual machines"} {
		if _, err := applyIdentityScope(Config{TopicPrefix: "ugos_bridge", HostName: hostName, IdentityScope: IdentityScopeHost}); err == nil {
			t.Fatalf("host name %q accepted, want error", hostName)
		}
	}
}

func newHostScopedPublisher(client *recordingClient, hostName string) *Publisher {
	cfg, err := applyIdentityScope(Config{
		ClientID:         "ugos-bridge",
		TopicPrefix:      "ugos_bridge",
		DiscoveryPrefix:  "homeassistant",
		QoS:              1,
		Retain:           true,
		ProcessAllowlist: []string{"dockerd"},
		IdentityScope:    IdentityScopeHost,
		HostName:         hostName,
	})
	if err != nil {
		panic(err)
	}
	return &Publisher{
		client:             client,
		cfg:                cfg,
		availabilityTopic:  cfg.TopicPrefix + "/status",
		availabilityOnline: "online_host",
		discoveredEntities: map[string]publishedEntity{},
		lastPayloads:       map[string]string{},
		preparedPayloads:   map[string]preparedPayload{},
	}
}

func TestHostScopeSharesNoTopicOrIdentityWithGlobalScope(t *testing.T) {
	client := &recordingClient{connectionOpen: true}
	publisher := newHostScopedPublisher(client, "cubie-a7a")
	snapshot := identitySnapshot()
	snapshot.Host.Name = "cubie-a7a"
	lines := identityPublishes(t, publisher, client, snapshot)

	raw, err := os.ReadFile(filepath.Join("testdata", "global_scope.golden"))
	if err != nil {
		t.Fatal(err)
	}
	globalTopics := map[string]struct{}{}
	for _, line := range strings.Split(strings.ReplaceAll(string(raw), "\r\n", "\n"), "\n") {
		if topic, _, ok := strings.Cut(line, "\t"); ok {
			globalTopics[topic] = struct{}{}
		}
	}

	const hostDeviceID = "ugos_bridge_host_cubie_a7a"
	discoveryCount := 0
	for _, line := range lines {
		parts := strings.SplitN(line, "\t", 3)
		topic, payload := parts[0], parts[2]
		if _, shared := globalTopics[topic]; shared {
			t.Fatalf("host scope publishes a global scope topic: %s", topic)
		}
		if !strings.HasPrefix(topic, "homeassistant/") {
			if !strings.HasPrefix(topic, "ugos_bridge/cubie_a7a/") {
				t.Fatalf("state topic %s is outside the host namespace", topic)
			}
			continue
		}
		if payload == "" {
			t.Fatalf("host scope cleared discovery topic %s", topic)
		}

		discoveryCount++
		var config map[string]any
		if err := json.Unmarshal([]byte(payload), &config); err != nil {
			t.Fatalf("discovery payload for %s: %v", topic, err)
		}
		levels := strings.Split(topic, "/")
		component, nodeID, objectID := levels[1], levels[2], levels[3]
		uniqueID, _ := config["unique_id"].(string)
		if uniqueID != nodeID+"_"+objectID || !strings.HasPrefix(uniqueID, hostDeviceID) {
			t.Fatalf("discovery topic %s does not follow unique_id %q", topic, uniqueID)
		}
		if got := config["default_entity_id"]; got != component+"."+uniqueID {
			t.Fatalf("default_entity_id for %s = %#v", topic, got)
		}
		device := config["device"].(map[string]any)
		identifiers := device["identifiers"].([]any)
		if id, _ := identifiers[0].(string); !strings.HasPrefix(id, hostDeviceID) {
			t.Fatalf("device identifier %q is outside the host namespace", id)
		}
		if via, ok := device["via_device"].(string); ok && !strings.HasPrefix(via, hostDeviceID) {
			t.Fatalf("via_device %q is outside the host namespace", via)
		}
	}
	if discoveryCount == 0 {
		t.Fatal("no discovery published")
	}

	project := configPayload(t, client, "homeassistant/sensor/ugos_bridge_host_cubie_a7a_project_ugos_bridge/cpu_usage_percent/config")
	if viaDevice(t, project) != hostDeviceID {
		t.Fatalf("project via_device = %q, want host device", viaDevice(t, project))
	}
	container := configPayload(t, client, "homeassistant/sensor/ugos_bridge_host_cubie_a7a_container_ugos_bridge/cpu_usage_percent/config")
	if viaDevice(t, container) != hostDeviceID+"_project_ugos_bridge" {
		t.Fatalf("container via_device = %q", viaDevice(t, container))
	}
	if name := container["device"].(map[string]any)["name"]; name != "cubie-a7a Docker container ugos-bridge" {
		t.Fatalf("container device name = %#v", name)
	}

	var attributes map[string]any
	if err := json.Unmarshal([]byte(messagePayload(t, client, "ugos_bridge/cubie_a7a/containers/ugos_bridge/attributes")), &attributes); err != nil {
		t.Fatal(err)
	}
	if attributes["host"] != "cubie-a7a" {
		t.Fatalf("container attributes host = %#v", attributes["host"])
	}
	if err := json.Unmarshal([]byte(messagePayload(t, client, "ugos_bridge/cubie_a7a/host/attributes")), &attributes); err != nil {
		t.Fatal(err)
	}
	if attributes["identity_scope"] != "host" {
		t.Fatalf("host attributes identity_scope = %#v", attributes["identity_scope"])
	}
}

func TestHostScopeDockerOnlyHasNoHostParent(t *testing.T) {
	client := &recordingClient{connectionOpen: true}
	publisher := newHostScopedPublisher(client, "cubie-a7a")
	snapshot := identitySnapshot()
	snapshot.Host = nil
	identityPublishes(t, publisher, client, snapshot)

	project := configPayload(t, client, "homeassistant/sensor/ugos_bridge_host_cubie_a7a_project_ugos_bridge/cpu_usage_percent/config")
	if _, ok := project["device"].(map[string]any)["via_device"]; ok {
		t.Fatalf("Docker-only project points at an unpublished host device: %#v", project["device"])
	}
}

func newGuardedPublisher(client *recordingClient) *Publisher {
	return &Publisher{
		client:             client,
		cfg:                Config{ClientID: "ugos-bridge", TopicPrefix: "ugos_bridge", DiscoveryPrefix: "homeassistant", QoS: 1, Retain: true},
		availabilityTopic:  "ugos_bridge/status",
		availabilityOnline: newAvailabilityPayload("ugos-bridge"),
		discoveredEntities: map[string]publishedEntity{},
		lastPayloads:       map[string]string{},
		preparedPayloads:   map[string]preparedPayload{},
		availabilityGuard:  newAvailabilityGuard(0),
	}
}

func TestAvailabilityGuardWaitsForForeignBridgeToGoOffline(t *testing.T) {
	// A bridge without owner prefixes, like the NAS on 1.0.7, is online.
	client := &recordingClient{connectionOpen: true, retained: map[string]string{"ugos_bridge/status": "online_a1b2c3d4e5f6"}}
	publisher := newGuardedPublisher(client)
	snapshot := model.Snapshot{Projects: []model.ProjectSnapshot{{Name: "apps"}}}

	publisher.beginAvailabilityReplay(client)
	err := publisher.PublishSnapshot(snapshot)
	if !errors.Is(err, ErrAvailabilityConflict) {
		t.Fatalf("PublishSnapshot error = %v, want ErrAvailabilityConflict", err)
	}
	if len(client.publishes) != 0 {
		t.Fatalf("blocked bridge published: %#v", client.publishes)
	}

	// A stale live payload alone does not unblock; the retained state does.
	publisher.observeAvailability(client, "offline", false)
	if err := publisher.PublishSnapshot(snapshot); !errors.Is(err, ErrAvailabilityConflict) {
		t.Fatalf("PublishSnapshot error = %v, want ErrAvailabilityConflict", err)
	}
	client.retained["ugos_bridge/status"] = "offline"
	if err := publisher.PublishSnapshot(snapshot); err != nil {
		t.Fatalf("PublishSnapshot after the other bridge went offline: %v", err)
	}
	if first := client.publishes[0]; first.topic != "ugos_bridge/status" || first.payload != "offline" {
		t.Fatalf("first publish = %#v, want availability barrier", first)
	}
	if last := client.publishes[len(client.publishes)-1]; last.topic != "ugos_bridge/status" || last.payload != publisher.availablePayload() {
		t.Fatalf("last publish = %#v, want availability commit", last)
	}
}

func TestAvailabilityGuardDecidesOnRetainedValue(t *testing.T) {
	// The persistent session also replays this bridge's old last will, and its
	// handler may run after the one for the current retained value.
	client := &recordingClient{
		connectionOpen: true,
		queued:         map[string][]string{"ugos_bridge/status": {"offline"}},
		retained:       map[string]string{"ugos_bridge/status": "online_a1b2c3d4e5f6"},
	}
	publisher := newGuardedPublisher(client)

	publisher.beginAvailabilityReplay(client)
	if len(client.publishes) != 0 {
		t.Fatalf("bridge published over a foreign online payload: %#v", client.publishes)
	}

	client.retained = nil
	client.publishes = nil
	publisher.beginAvailabilityReplay(client)
	if len(client.publishes) != 1 || client.publishes[0].payload != "offline" {
		t.Fatalf("publishes = %#v, want the barrier when nothing is retained", client.publishes)
	}
}

func TestAvailabilityGuardIgnoresEarlierProcessOfSameClient(t *testing.T) {
	// The broker allows one session per client ID, so an earlier process of
	// this client is gone even when its payload is still retained.
	client := &recordingClient{connectionOpen: true, retained: map[string]string{"ugos_bridge/status": availabilityOwnerPrefix("ugos-bridge") + "000000000000"}}
	publisher := newGuardedPublisher(client)

	publisher.beginAvailabilityReplay(client)
	if len(client.publishes) != 1 || client.publishes[0].payload != "offline" {
		t.Fatalf("publishes = %#v, want only the availability barrier", client.publishes)
	}
	if err := publisher.PublishSnapshot(model.Snapshot{}); err != nil {
		t.Fatalf("PublishSnapshot returned error: %v", err)
	}
}

func TestCommittedBridgeRestoresAvailabilityMarkedOffline(t *testing.T) {
	client := &recordingClient{connectionOpen: true}
	publisher := newGuardedPublisher(client)
	publisher.beginAvailabilityReplay(client)
	if err := publisher.PublishSnapshot(model.Snapshot{}); err != nil {
		t.Fatalf("PublishSnapshot returned error: %v", err)
	}

	client.publishes = nil
	publisher.observeAvailability(client, "offline", false)
	if len(client.publishes) != 1 || client.publishes[0].payload != publisher.availablePayload() || !client.publishes[0].retained {
		t.Fatalf("publishes = %#v, want restored retained availability", client.publishes)
	}

	client.publishes = nil
	publisher.observeAvailability(client, "online_a1b2c3d4e5f6", false)
	if len(client.publishes) != 0 {
		t.Fatalf("committed bridge fought a foreign payload: %#v", client.publishes)
	}

	publisher.closing.Store(true)
	publisher.observeAvailability(client, "offline", false)
	if len(client.publishes) != 0 {
		t.Fatalf("closing bridge restored availability: %#v", client.publishes)
	}
}

func TestCloseLeavesForeignAvailabilityUntouched(t *testing.T) {
	client := &recordingClient{connectionOpen: true, retained: map[string]string{"ugos_bridge/status": "online_a1b2c3d4e5f6"}}
	publisher := newGuardedPublisher(client)
	publisher.beginAvailabilityReplay(client)

	publisher.Close()
	if len(client.publishes) != 0 {
		t.Fatalf("blocked bridge published on close: %#v", client.publishes)
	}
}

func TestNoteConnectionLostWarnsAfterRepeatedShortSessions(t *testing.T) {
	var logs bytes.Buffer
	publisher := newGuardedPublisher(&recordingClient{})
	publisher.log = zerolog.New(&logs)
	start := time.Now()

	publisher.connectedAt.Store(start.UnixNano())
	publisher.noteConnectionLost(start.Add(time.Hour))
	for range shortSessionWarnCount - 1 {
		publisher.noteConnectionLost(start.Add(time.Second))
	}
	if logs.Len() != 0 {
		t.Fatalf("warned too early: %s", logs.String())
	}
	publisher.noteConnectionLost(start.Add(time.Second))
	if !strings.Contains(logs.String(), "same client ID") {
		t.Fatalf("missing duplicate client ID warning, logs: %s", logs.String())
	}
}
