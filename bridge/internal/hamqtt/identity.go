package hamqtt

import (
	"fmt"
	"strings"
)

// IdentityScope selects how Home Assistant IDs, MQTT topics and the MQTT
// client ID are namespaced.
type IdentityScope string

const (
	// IdentityScopeGlobal keeps the single-bridge IDs and topics that existing
	// installations depend on. The zero value behaves the same.
	IdentityScopeGlobal IdentityScope = "global"
	// IdentityScopeHost namespaces every ID, topic and the client ID by the
	// host name so several bridges can share one broker and Home Assistant.
	IdentityScopeHost IdentityScope = "host"
)

const defaultTopicPrefix = "ugos_bridge"

// reservedHostSlugs are the global scope's top-level topic names; a host scope
// namespace with one of these names would share topics with a global bridge.
var reservedHostSlugs = map[string]struct{}{
	"status":           {},
	"host":             {},
	"projects":         {},
	"containers":       {},
	"virtual_machines": {},
}

// ParseIdentityScope parses "global" or "host"; an empty value means global.
func ParseIdentityScope(raw string) (IdentityScope, error) {
	switch IdentityScope(strings.ToLower(strings.TrimSpace(raw))) {
	case "", IdentityScopeGlobal:
		return IdentityScopeGlobal, nil
	case IdentityScopeHost:
		return IdentityScopeHost, nil
	default:
		return "", fmt.Errorf("unknown identity scope %q, expected global or host", raw)
	}
}

// applyIdentityScope appends the host slug to the client ID and topic prefix in
// host scope. Explicit values are namespaced too, so a copied single-bridge
// configuration cannot reuse another bridge's client ID or topics.
func applyIdentityScope(cfg Config) (Config, error) {
	if cfg.IdentityScope != IdentityScopeHost {
		return cfg, nil
	}
	if strings.TrimSpace(cfg.HostName) == "" {
		return cfg, fmt.Errorf("host identity scope requires a host name")
	}
	hostSlug := slugify(cfg.HostName)
	if _, reserved := reservedHostSlugs[hostSlug]; reserved {
		return cfg, fmt.Errorf("host name %q is reserved in host identity scope; choose another host name", cfg.HostName)
	}
	cfg.ClientID = cfg.ClientID + "-" + hostSlug
	cfg.TopicPrefix = trimSlashes(cfg.TopicPrefix) + "/" + hostSlug
	return cfg, nil
}

func (p *Publisher) hostScoped() bool {
	return p.cfg.IdentityScope == IdentityScopeHost
}

// scopedHostDeviceID is the host device ID derived from the configured host
// name. Host scope requires that name, so it is known in Docker-only mode too.
func (p *Publisher) scopedHostDeviceID() string {
	return "ugos_bridge_host_" + slugify(p.cfg.HostName)
}

// workloadDeviceID returns a Docker project, container or VM device ID. Global
// scope keeps the historical host-less IDs; host scope nests them under the
// host device like every other host child.
func (p *Publisher) workloadDeviceID(kind string, slug string) string {
	if p.hostScoped() {
		return fmt.Sprintf("%s_%s_%s", p.scopedHostDeviceID(), kind, slug)
	}
	return fmt.Sprintf("ugos_bridge_%s_%s", kind, slug)
}

// workloadDeviceName prefixes Docker and VM device names with the host in host
// scope, where same-named workloads on several hosts would otherwise look alike.
func (p *Publisher) workloadDeviceName(name string) string {
	if p.hostScoped() {
		return strings.TrimSpace(p.cfg.HostName) + " " + name
	}
	return name
}

// entityDiscoveryTopic keeps the global scope's historical discovery node IDs.
// Host scope uses the entity ID base as node ID, so the discovery topic is a
// function of the unique_id and cannot be shared by two hosts.
func (p *Publisher) entityDiscoveryTopic(component string, globalNodeSlug string, entityID string, objectID string) string {
	if p.hostScoped() {
		return fmt.Sprintf("%s/%s/%s/%s/config", trimSlashes(p.cfg.DiscoveryPrefix), component, entityID, objectID)
	}
	return p.discoveryTopic(component, globalNodeSlug, objectID)
}

// addScopedDiscoveryFields sets default_entity_id in host scope. Home
// Assistant 2025.10+ uses it only when it first creates an entity. Global scope
// leaves payloads unchanged; releases before 2025.10 may reject unknown keys.
func (p *Publisher) addScopedDiscoveryFields(payload map[string]any, component string, entityID string, objectID string) {
	if p.hostScoped() {
		payload["default_entity_id"] = fmt.Sprintf("%s.%s_%s", component, entityID, objectID)
	}
}

// addScopedAttributes marks workload attributes with their host in host scope
// so the cards can attribute entities without relying on entity IDs.
func (p *Publisher) addScopedAttributes(attributes map[string]any) map[string]any {
	if p.hostScoped() {
		attributes["host"] = strings.TrimSpace(p.cfg.HostName)
	}
	return attributes
}
