package hamqtt

import (
	"crypto/sha256"
	"errors"
	"fmt"
	"strings"
	"sync/atomic"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

// ErrAvailabilityConflict indicates that another bridge process is online on
// this publisher's availability topic, so publishing would overwrite its
// retained entities.
var ErrAvailabilityConflict = errors.New("another bridge instance is online on the MQTT availability topic")

const (
	// availabilityProbeWait bounds the wait for a retained availability value.
	// MQTT has no "nothing retained" signal; brokers send retained messages
	// right after the SUBACK.
	availabilityProbeWait = time.Second
	// A session shorter than this counts towards the duplicate client ID hint.
	shortSessionThreshold = 30 * time.Second
	shortSessionWarnCount = 3
)

// availabilityGuard keeps a bridge from overwriting the retained topics of
// another bridge process that is online on the same availability topic.
type availabilityGuard struct {
	probeWait time.Duration
	// retainedSeen signals the retained value sent for a new subscription.
	retainedSeen chan struct{}
	// retained is that value: the topic's state when the subscription began.
	retained          atomic.Pointer[string]
	blockedGeneration atomic.Uint64
	connectedAt       atomic.Int64
	shortSessions     atomic.Int32
	closing           atomic.Bool
}

func newAvailabilityGuard(probeWait time.Duration) availabilityGuard {
	return availabilityGuard{probeWait: probeWait, retainedSeen: make(chan struct{}, 1)}
}

// probeAvailability subscribes to the own availability topic and returns the
// payload of a foreign online bridge, or "" when the topic is free. It decides
// on the retained value the broker sends for every subscription request;
// messages queued in the persistent session may be older, and paho may run
// their handlers in any order. A failed
// subscription (for example a publish-only ACL) disables the guard for this
// connection instead of blocking publication.
func (p *Publisher) probeAvailability(client mqtt.Client) string {
	p.retained.Store(nil)
	if p.retainedSeen != nil {
		select {
		case <-p.retainedSeen:
		default:
		}
	}

	token := client.Subscribe(p.availabilityTopic, p.cfg.QoS, func(c mqtt.Client, msg mqtt.Message) {
		p.observeAvailability(c, string(msg.Payload()), msg.Retained())
	})
	if !waitToken(token, p.cfg.ConnectTimeout) || token.Error() != nil || subscriptionRefused(token, p.availabilityTopic) {
		p.log.Warn().Err(token.Error()).Str("topic", p.availabilityTopic).
			Msg("cannot watch the MQTT availability topic; the duplicate bridge guard is off for this connection")
		return ""
	}
	if p.probeWait > 0 && p.retained.Load() == nil && p.retainedSeen != nil {
		timer := time.NewTimer(p.probeWait)
		select {
		case <-p.retainedSeen:
		case <-timer.C:
		}
		timer.Stop()
	}
	if retained := p.retained.Load(); retained != nil && p.isForeignAvailability(*retained) {
		return *retained
	}
	return ""
}

// observeAvailability hands retained payloads to the probe. A committed
// bridge restores its own payload when something else marks it offline, and
// reports a foreign online payload.
func (p *Publisher) observeAvailability(client mqtt.Client, payload string, retained bool) {
	if retained {
		p.retained.Store(&payload)
		if p.retainedSeen != nil {
			select {
			case p.retainedSeen <- struct{}{}:
			default:
			}
		}
	}

	generation := p.connectionGeneration.Load()
	if generation == 0 || p.committedGeneration.Load() != generation || p.closing.Load() {
		return
	}
	switch {
	case p.isForeignAvailability(payload):
		p.log.Error().Str("topic", p.availabilityTopic).Str("payload", payload).
			Msg("another ugos-bridge instance published on this bridge's MQTT availability topic; give each bridge its own host name and UGOS_BRIDGE_MQTT_IDENTITY_SCOPE=host")
	case payload == "offline" || payload == "":
		p.log.Warn().Str("topic", p.availabilityTopic).
			Msg("MQTT availability topic was marked offline by another client; restoring it")
		token := client.Publish(p.availabilityTopic, p.cfg.QoS, true, p.availablePayload())
		if waitToken(token, p.cfg.ConnectTimeout) && token.Error() != nil {
			p.log.Error().Err(token.Error()).Msg("failed to restore MQTT availability")
		}
	}
}

// isForeignAvailability reports an online payload of another bridge process.
// A payload with this client ID's owner prefix belongs to an earlier process
// of this bridge: the broker allows one live session per client ID, so that
// process is gone. Payloads of releases without an owner prefix count as
// foreign because their owner cannot be told apart.
func (p *Publisher) isForeignAvailability(payload string) bool {
	if !strings.HasPrefix(payload, "online_") || payload == p.availablePayload() {
		return false
	}
	return !strings.HasPrefix(payload, availabilityOwnerPrefix(p.cfg.ClientID))
}

// noteConnectionLost warns when sessions keep ending right after they start,
// the usual symptom of two clients sharing one client ID.
func (p *Publisher) noteConnectionLost(now time.Time) {
	connectedAt := p.connectedAt.Load()
	if connectedAt == 0 || now.Sub(time.Unix(0, connectedAt)) > shortSessionThreshold {
		p.shortSessions.Store(0)
		return
	}
	if p.shortSessions.Add(1) >= shortSessionWarnCount {
		p.shortSessions.Store(0)
		p.log.Warn().Str("client_id", p.cfg.ClientID).
			Msg("MQTT connection keeps dropping right after connecting; another client may be using the same client ID")
	}
}

// newAvailabilityPayload returns a process-lifetime online payload: an owner
// prefix derived from the client ID plus a per-process suffix.
func newAvailabilityPayload(clientID string) string {
	sum := sha256.Sum256([]byte(fmt.Sprintf("%s:%d", clientID, time.Now().UnixNano())))
	return fmt.Sprintf("%s%x", availabilityOwnerPrefix(clientID), sum[:6])
}

func availabilityOwnerPrefix(clientID string) string {
	sum := sha256.Sum256([]byte(clientID))
	return fmt.Sprintf("online_%x_", sum[:4])
}

func logIdentityScope(cfg Config) {
	if cfg.IdentityScope == IdentityScopeHost {
		cfg.Log.Info().Str("client_id", cfg.ClientID).Str("topic_prefix", cfg.TopicPrefix).
			Msg("MQTT identity scope is host: IDs, topics and the client ID are namespaced by host name")
		return
	}
	if trimSlashes(cfg.TopicPrefix) != defaultTopicPrefix {
		cfg.Log.Info().Str("topic_prefix", cfg.TopicPrefix).
			Msg("MQTT identity scope is global: a custom topic prefix does not make Home Assistant discovery IDs unique; a second bridge on this broker needs UGOS_BRIDGE_MQTT_IDENTITY_SCOPE=host")
	}
}

func waitToken(token mqtt.Token, timeout time.Duration) bool {
	if timeout <= 0 {
		return token.Wait()
	}
	return token.WaitTimeout(timeout)
}

func subscriptionRefused(token mqtt.Token, topic string) bool {
	subscribe, ok := token.(*mqtt.SubscribeToken)
	if !ok {
		return false
	}
	qos, found := subscribe.Result()[topic]
	return found && qos == 0x80
}
