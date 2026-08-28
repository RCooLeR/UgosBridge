package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"sort"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	cli "github.com/urfave/cli/v3"

	dockercollector "github.com/RCooLeR/UgosBridge/bridge/internal/collectors/docker"
	hostcollector "github.com/RCooLeR/UgosBridge/bridge/internal/collectors/host"
	"github.com/RCooLeR/UgosBridge/bridge/internal/dockerapi"
	"github.com/RCooLeR/UgosBridge/bridge/internal/model"
	mqttoutput "github.com/RCooLeR/UgosBridge/bridge/internal/outputs/mqtt"
	prometheusoutput "github.com/RCooLeR/UgosBridge/bridge/internal/outputs/prometheus"
)

var (
	version = "dev"
	commit  = "none"
	date    = "unknown"
)

func main() {
	zerolog.TimeFieldFormat = time.RFC3339
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: time.RFC3339})

	app := &cli.Command{
		Name:    "ugos-bridge",
		Usage:   "Bridge UGOS host, Docker, and virtual machine metrics to Prometheus and MQTT/Home Assistant",
		Version: buildVersion(),
		Flags:   buildFlags(),
		Commands: []*cli.Command{
			buildHealthcheckCommand(),
		},
		Action: func(ctx context.Context, cmd *cli.Command) error {
			cfg, err := configFromCLI(cmd)
			if err != nil {
				return err
			}
			return run(ctx, cfg)
		},
	}

	if err := app.Run(context.Background(), os.Args); err != nil {
		log.Fatal().Err(err).Msg("bridge stopped")
	}
}

func buildVersion() string {
	return fmt.Sprintf("%s (commit=%s, date=%s)", version, commit, date)
}

func buildHealthcheckCommand() *cli.Command {
	return &cli.Command{
		Name:  "healthcheck",
		Usage: "Check whether the bridge HTTP endpoint is healthy",
		Flags: []cli.Flag{
			&cli.StringFlag{
				Name:    "url",
				Value:   "http://127.0.0.1:9877/healthz",
				Sources: envVars("UGOS_BRIDGE_HEALTHCHECK_URL"),
			},
			&cli.DurationFlag{
				Name:    "timeout",
				Value:   3 * time.Second,
				Sources: envVars("UGOS_BRIDGE_HEALTHCHECK_TIMEOUT"),
			},
		},
		Action: func(ctx context.Context, cmd *cli.Command) error {
			return checkHealth(ctx, cmd.String("url"), cmd.Duration("timeout"))
		},
	}
}

func checkHealth(ctx context.Context, endpoint string, timeout time.Duration) error {
	if strings.TrimSpace(endpoint) == "" {
		return fmt.Errorf("healthcheck URL must not be empty")
	}
	if timeout <= 0 {
		return fmt.Errorf("healthcheck timeout must be greater than zero")
	}

	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return fmt.Errorf("create healthcheck request: %w", err)
	}
	client := &http.Client{
		CheckRedirect: func(_ *http.Request, _ []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("healthcheck request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return fmt.Errorf("healthcheck returned %s", resp.Status)
	}
	return nil
}

type config struct {
	ListenAddress                string
	MetricsPath                  string
	ScrapeInterval               time.Duration
	DockerHost                   string
	DockerTimeout                time.Duration
	ProjectLabel                 string
	StandaloneProjectName        string
	ContainerConcurrency         int
	DetailedContainerStats       bool
	MQTTEnabled                  bool
	MQTTBroker                   string
	MQTTClientID                 string
	MQTTUsername                 string
	MQTTPassword                 string
	MQTTTopicPrefix              string
	DiscoveryPrefix              string
	MQTTQoS                      byte
	MQTTRetain                   bool
	MQTTInterval                 time.Duration
	MQTTConnectTimeout           time.Duration
	MQTTProcessAllowlist         []string
	HomeAssistantEntityGrace     time.Duration
	HostMetricsEnabled           bool
	HostProcFS                   string
	HostSysFS                    string
	HostNameOverride             string
	HostHostnamePath             string
	HostFilesystems              []hostcollector.FilesystemMount
	HostNetworkInclude           []string
	HostDRIPath                  string
	HostTemperatureAverageWindow time.Duration
	HostUPSEnabled               bool
	HostUPSCommand               string
	HostUPSTargets               []string
	HostUPSTimeout               time.Duration
	HostIntelGPUTopEnabled       bool
	HostIntelGPUTopPath          string
	HostIntelGPUTopDevice        string
	HostIntelGPUTopPeriod        time.Duration
	HostVMsEnabled               bool
	HostVirshPath                string
	HostVirshURI                 string
	HostVirshTimeout             time.Duration
	HostVMNameOverrides          map[string]string
}

type snapshotStore struct {
	mu       sync.RWMutex
	snapshot model.Snapshot
	ok       bool
}

func (s *snapshotStore) Set(snapshot model.Snapshot) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.snapshot = snapshot
	s.ok = true
}

func (s *snapshotStore) Get() (model.Snapshot, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.snapshot, s.ok
}

func buildFlags() []cli.Flag {
	return []cli.Flag{
		&cli.StringFlag{Name: "listen-address", Value: ":9877", Sources: envVars("LISTEN_ADDRESS", "UGOS_BRIDGE_LISTEN_ADDRESS")},
		&cli.StringFlag{Name: "metrics-path", Value: "/metrics", Sources: envVars("METRICS_PATH", "UGOS_BRIDGE_METRICS_PATH")},
		&cli.DurationFlag{Name: "scrape-interval", Value: 15 * time.Second, Sources: envVars("SCRAPE_INTERVAL", "UGOS_BRIDGE_SCRAPE_INTERVAL")},
		&cli.StringFlag{Name: "docker-host", Value: "unix:///var/run/docker.sock", Sources: envVars("DOCKER_HOST", "UGOS_BRIDGE_DOCKER_HOST")},
		&cli.DurationFlag{Name: "docker-timeout", Value: 5 * time.Second, Sources: envVars("DOCKER_TIMEOUT", "UGOS_BRIDGE_DOCKER_TIMEOUT")},
		&cli.StringFlag{Name: "project-label", Value: "com.docker.compose.project", Sources: envVars("DOCKER_PROJECT_LABEL", "UGOS_BRIDGE_PROJECT_LABEL")},
		&cli.StringFlag{Name: "standalone-project-name", Value: "standalone", Sources: envVars("STANDALONE_PROJECT_NAME", "UGOS_BRIDGE_STANDALONE_PROJECT_NAME")},
		&cli.IntFlag{Name: "container-concurrency", Value: 4, Sources: envVars("CONTAINER_CONCURRENCY", "UGOS_BRIDGE_CONTAINER_CONCURRENCY")},
		&cli.BoolFlag{Name: "detailed-container-stats", Sources: envVars("DETAILED_CONTAINER_STATS", "UGOS_BRIDGE_DETAILED_CONTAINER_STATS")},
		&cli.BoolFlag{Name: "mqtt-enabled", Sources: envVars("UGOS_BRIDGE_MQTT_ENABLED")},
		&cli.StringFlag{Name: "mqtt-broker", Sources: envVars("MQTT_BROKER", "UGOS_BRIDGE_MQTT_BROKER")},
		&cli.StringFlag{Name: "mqtt-client-id", Value: "ugos-bridge", Sources: envVars("MQTT_CLIENT_ID", "UGOS_BRIDGE_MQTT_CLIENT_ID")},
		&cli.StringFlag{Name: "mqtt-username", Sources: envVars("MQTT_USERNAME", "UGOS_BRIDGE_MQTT_USER")},
		&cli.StringFlag{Name: "mqtt-password", Sources: envVars("MQTT_PASSWORD", "UGOS_BRIDGE_MQTT_PASS")},
		&cli.StringFlag{Name: "mqtt-topic-prefix", Value: "ugos_bridge", Sources: envVars("MQTT_TOPIC_PREFIX", "UGOS_BRIDGE_MQTT_TOPIC_PREFIX")},
		&cli.StringFlag{Name: "homeassistant-discovery-prefix", Value: "homeassistant", Sources: envVars("HOMEASSISTANT_DISCOVERY_PREFIX", "UGOS_BRIDGE_MQTT_DISCOVERY_PREFIX")},
		&cli.UintFlag{Name: "mqtt-qos", Value: 1, Sources: envVars("MQTT_QOS", "UGOS_BRIDGE_MQTT_QOS")},
		&cli.BoolFlag{Name: "mqtt-retain", Value: true, Sources: envVars("MQTT_RETAIN", "UGOS_BRIDGE_MQTT_RETAIN")},
		&cli.StringFlag{Name: "mqtt-interval", Value: "15s", Sources: envVars("UGOS_BRIDGE_MQTT_INTERVAL")},
		&cli.DurationFlag{Name: "mqtt-connect-timeout", Value: 10 * time.Second, Sources: envVars("MQTT_CONNECT_TIMEOUT", "UGOS_BRIDGE_MQTT_CONNECT_TIMEOUT")},
		&cli.StringFlag{Name: "mqtt-process-allowlist", Sources: envVars("UGOS_BRIDGE_MQTT_PROCESS_ALLOWLIST")},
		&cli.StringFlag{Name: "homeassistant-entity-grace", Aliases: []string{"homeassistant-expire-after"}, Value: "45s", Sources: envVars("UGOS_BRIDGE_MQTT_ENTITY_GRACE", "HOMEASSISTANT_EXPIRE_AFTER", "UGOS_BRIDGE_MQTT_EXPIRE_AFTER")},
		&cli.BoolFlag{Name: "host-metrics-enabled", Sources: envVars("HOST_METRICS_ENABLED", "UGOS_BRIDGE_HOST_METRICS_ENABLED")},
		&cli.StringFlag{Name: "host-procfs", Value: "/host/proc", Sources: envVars("HOST_PROCFS", "UGOS_BRIDGE_HOST_PROCFS")},
		&cli.StringFlag{Name: "host-sysfs", Value: "/host/sys", Sources: envVars("HOST_SYSFS", "UGOS_BRIDGE_HOST_SYSFS")},
		&cli.StringFlag{Name: "host-name", Sources: envVars("HOST_NAME", "UGOS_BRIDGE_HOST_NAME")},
		&cli.StringFlag{Name: "host-hostname-path", Value: "/rootfs/etc/hostname", Sources: envVars("HOST_HOSTNAME_PATH", "UGOS_BRIDGE_HOST_HOSTNAME_PATH")},
		&cli.StringFlag{Name: "host-filesystems", Value: "/:/rootfs,/volume1:/volume1,/volume2:/volume2", Sources: envVars("HOST_FILESYSTEMS", "UGOS_BRIDGE_HOST_FILESYSTEMS")},
		&cli.StringFlag{Name: "host-network-include", Value: "eth.*,bond.*", Sources: envVars("HOST_NETWORK_INCLUDE", "UGOS_BRIDGE_HOST_NETWORK_INCLUDE")},
		&cli.StringFlag{Name: "host-dri-path", Value: "/dev/dri", Sources: envVars("HOST_DRI_PATH", "UGOS_BRIDGE_HOST_DRI_PATH")},
		&cli.DurationFlag{Name: "host-temperature-average-window", Value: 2 * time.Minute, Sources: envVars("UGOS_BRIDGE_HOST_TEMPERATURE_AVERAGE_WINDOW")},
		&cli.BoolFlag{Name: "host-ups-enabled", Sources: envVars("UGOS_BRIDGE_HOST_UPS_ENABLED")},
		&cli.StringFlag{Name: "host-ups-command", Value: "upsc", Sources: envVars("UGOS_BRIDGE_HOST_UPS_COMMAND")},
		&cli.StringFlag{Name: "host-ups-targets", Sources: envVars("UGOS_BRIDGE_HOST_UPS_TARGETS")},
		&cli.DurationFlag{Name: "host-ups-timeout", Value: 3 * time.Second, Sources: envVars("UGOS_BRIDGE_HOST_UPS_TIMEOUT")},
		&cli.BoolFlag{Name: "host-intel-gpu-top-enabled", Sources: envVars("UGOS_BRIDGE_HOST_INTEL_GPU_TOP_ENABLED")},
		&cli.StringFlag{Name: "host-intel-gpu-top-path", Value: "intel_gpu_top", Sources: envVars("UGOS_BRIDGE_HOST_INTEL_GPU_TOP_PATH")},
		&cli.StringFlag{Name: "host-intel-gpu-top-device", Sources: envVars("UGOS_BRIDGE_HOST_INTEL_GPU_TOP_DEVICE")},
		&cli.DurationFlag{Name: "host-intel-gpu-top-period", Value: time.Second, Sources: envVars("UGOS_BRIDGE_HOST_INTEL_GPU_TOP_PERIOD")},
		&cli.BoolFlag{Name: "host-virtual-machines-enabled", Value: true, Sources: envVars("UGOS_BRIDGE_HOST_VMS_ENABLED")},
		&cli.StringFlag{Name: "host-virsh-path", Value: "virsh", Sources: envVars("UGOS_BRIDGE_HOST_VIRSH_PATH")},
		&cli.StringFlag{Name: "host-virsh-uri", Value: "qemu:///system", Sources: envVars("UGOS_BRIDGE_HOST_VIRSH_URI")},
		&cli.DurationFlag{Name: "host-virsh-timeout", Value: 3 * time.Second, Sources: envVars("UGOS_BRIDGE_HOST_VIRSH_TIMEOUT")},
		&cli.StringFlag{Name: "host-vm-name-overrides", Sources: envVars("UGOS_BRIDGE_VM_NAMES", "UGOS_BRIDGE_HOST_VM_NAME_OVERRIDES")},
	}
}

func envVars(values ...string) cli.ValueSourceChain {
	return cli.EnvVars(values...)
}

func configFromCLI(c *cli.Command) (config, error) {
	qos := c.Uint("mqtt-qos")
	if qos > 2 {
		return config{}, fmt.Errorf("mqtt-qos must be 0, 1, or 2")
	}
	concurrency := c.Int("container-concurrency")
	if concurrency < 1 {
		return config{}, fmt.Errorf("container-concurrency must be at least 1")
	}
	mqttInterval, err := parseFlexibleDuration(c.String("mqtt-interval"))
	if err != nil {
		return config{}, fmt.Errorf("mqtt-interval: %w", err)
	}
	entityGraceRaw := c.String("homeassistant-entity-grace")
	if c.IsSet("homeassistant-expire-after") {
		entityGraceRaw = c.String("homeassistant-expire-after")
	}
	entityGrace, err := parseFlexibleDuration(entityGraceRaw)
	if err != nil {
		return config{}, fmt.Errorf("homeassistant-entity-grace: %w", err)
	}
	if mqttInterval <= 0 {
		return config{}, fmt.Errorf("mqtt-interval must be greater than zero")
	}
	if entityGrace <= 0 {
		return config{}, fmt.Errorf("homeassistant-entity-grace must be greater than zero")
	}
	hostFilesystems, err := parseFilesystemMounts(c.String("host-filesystems"))
	if err != nil {
		return config{}, fmt.Errorf("host-filesystems: %w", err)
	}
	hostNetworkInclude := parseCSV(c.String("host-network-include"))
	vmNameOverrides, err := parseNameOverrides(c.String("host-vm-name-overrides"))
	if err != nil {
		return config{}, fmt.Errorf("host-vm-name-overrides: %w", err)
	}

	return config{
		ListenAddress:                c.String("listen-address"),
		MetricsPath:                  c.String("metrics-path"),
		ScrapeInterval:               c.Duration("scrape-interval"),
		DockerHost:                   c.String("docker-host"),
		DockerTimeout:                c.Duration("docker-timeout"),
		ProjectLabel:                 c.String("project-label"),
		StandaloneProjectName:        c.String("standalone-project-name"),
		ContainerConcurrency:         concurrency,
		DetailedContainerStats:       c.Bool("detailed-container-stats"),
		MQTTEnabled:                  c.Bool("mqtt-enabled"),
		MQTTBroker:                   c.String("mqtt-broker"),
		MQTTClientID:                 c.String("mqtt-client-id"),
		MQTTUsername:                 c.String("mqtt-username"),
		MQTTPassword:                 c.String("mqtt-password"),
		MQTTTopicPrefix:              c.String("mqtt-topic-prefix"),
		DiscoveryPrefix:              c.String("homeassistant-discovery-prefix"),
		MQTTQoS:                      byte(qos),
		MQTTRetain:                   c.Bool("mqtt-retain"),
		MQTTInterval:                 mqttInterval,
		MQTTConnectTimeout:           c.Duration("mqtt-connect-timeout"),
		MQTTProcessAllowlist:         parseCSV(c.String("mqtt-process-allowlist")),
		HomeAssistantEntityGrace:     entityGrace,
		HostMetricsEnabled:           c.Bool("host-metrics-enabled"),
		HostProcFS:                   c.String("host-procfs"),
		HostSysFS:                    c.String("host-sysfs"),
		HostNameOverride:             c.String("host-name"),
		HostHostnamePath:             c.String("host-hostname-path"),
		HostFilesystems:              hostFilesystems,
		HostNetworkInclude:           hostNetworkInclude,
		HostDRIPath:                  c.String("host-dri-path"),
		HostTemperatureAverageWindow: c.Duration("host-temperature-average-window"),
		HostUPSEnabled:               c.Bool("host-ups-enabled"),
		HostUPSCommand:               c.String("host-ups-command"),
		HostUPSTargets:               parseCSV(c.String("host-ups-targets")),
		HostUPSTimeout:               c.Duration("host-ups-timeout"),
		HostIntelGPUTopEnabled:       c.Bool("host-intel-gpu-top-enabled"),
		HostIntelGPUTopPath:          c.String("host-intel-gpu-top-path"),
		HostIntelGPUTopDevice:        c.String("host-intel-gpu-top-device"),
		HostIntelGPUTopPeriod:        c.Duration("host-intel-gpu-top-period"),
		HostVMsEnabled:               c.Bool("host-virtual-machines-enabled"),
		HostVirshPath:                c.String("host-virsh-path"),
		HostVirshURI:                 c.String("host-virsh-uri"),
		HostVirshTimeout:             c.Duration("host-virsh-timeout"),
		HostVMNameOverrides:          vmNameOverrides,
	}, nil
}

func run(ctx context.Context, cfg config) error {
	logger := log.With().Str("listen", cfg.ListenAddress).Str("docker_host", cfg.DockerHost).Logger()

	registry := prometheus.NewRegistry()
	metrics := prometheusoutput.NewMetrics(registry)

	dockerClient, err := dockerapi.NewClient(cfg.DockerHost, cfg.DockerTimeout)
	if err != nil {
		return err
	}

	dockerCollector := dockercollector.New(dockerClient, dockercollector.Config{
		ProjectLabel:           cfg.ProjectLabel,
		StandaloneProjectName:  cfg.StandaloneProjectName,
		ContainerConcurrency:   cfg.ContainerConcurrency,
		DetailedContainerStats: cfg.DetailedContainerStats,
		Log:                    logger,
	})

	var hostCollector *hostcollector.Collector
	if cfg.HostMetricsEnabled {
		hostCollector, err = hostcollector.New(hostcollector.Config{
			ProcFS:                   cfg.HostProcFS,
			SysFS:                    cfg.HostSysFS,
			HostnameOverride:         cfg.HostNameOverride,
			HostnamePath:             cfg.HostHostnamePath,
			Filesystems:              cfg.HostFilesystems,
			NetworkInclude:           cfg.HostNetworkInclude,
			DRIPath:                  cfg.HostDRIPath,
			TemperatureAverageWindow: cfg.HostTemperatureAverageWindow,
			UPSEnabled:               cfg.HostUPSEnabled,
			UPSCommand:               cfg.HostUPSCommand,
			UPSTargets:               cfg.HostUPSTargets,
			UPSTimeout:               cfg.HostUPSTimeout,
			IntelGPUTopEnabled:       cfg.HostIntelGPUTopEnabled,
			IntelGPUTopPath:          cfg.HostIntelGPUTopPath,
			IntelGPUTopDevice:        cfg.HostIntelGPUTopDevice,
			IntelGPUTopPeriod:        cfg.HostIntelGPUTopPeriod,
			VMsEnabled:               cfg.HostVMsEnabled,
			VirshPath:                cfg.HostVirshPath,
			VirshURI:                 cfg.HostVirshURI,
			VirshTimeout:             cfg.HostVirshTimeout,
			VMNameOverrides:          cfg.HostVMNameOverrides,
		})
		if err != nil {
			return err
		}
	}

	mqttEnabled := cfg.MQTTEnabled || cfg.MQTTBroker != ""

	var publisher *mqttoutput.MQTTPublisher
	if mqttEnabled {
		if cfg.MQTTBroker == "" {
			return fmt.Errorf("mqtt is enabled but mqtt-broker is empty")
		}
		unavailableAfter := pollCount(cfg.HomeAssistantEntityGrace, cfg.MQTTInterval)
		publisher, err = mqttoutput.NewMQTTPublisher(mqttoutput.MQTTConfig{
			Broker:           cfg.MQTTBroker,
			ClientID:         cfg.MQTTClientID,
			Username:         cfg.MQTTUsername,
			Password:         cfg.MQTTPassword,
			TopicPrefix:      cfg.MQTTTopicPrefix,
			DiscoveryPrefix:  cfg.DiscoveryPrefix,
			QoS:              cfg.MQTTQoS,
			Retain:           cfg.MQTTRetain,
			ConnectTimeout:   cfg.MQTTConnectTimeout,
			ProcessAllowlist: cfg.MQTTProcessAllowlist,
			UnavailableAfter: unavailableAfter,
			RemoveAfter:      unavailableAfter * 10,
			Log:              logger,
		})
		if err != nil {
			return err
		}
		defer publisher.Close()
	}

	mux := http.NewServeMux()
	state := &snapshotStore{}
	mux.Handle(cfg.MetricsPath, promhttp.HandlerFor(registry, promhttp.HandlerOpts{
		EnableOpenMetrics: true,
		CoalesceGather:    true,
	}))
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})
	mux.HandleFunc("/api/processes", func(w http.ResponseWriter, r *http.Request) {
		handleProcessesAPI(w, r, state)
	})
	mux.HandleFunc("/api/vms", func(w http.ResponseWriter, r *http.Request) {
		handleVirtualMachinesAPI(w, r, state)
	})

	server := &http.Server{
		Addr:                cfg.ListenAddress,
		Handler:             mux,
		ReadHeaderTimeout:   5 * time.Second,
		MaxHeaderValueCount: 100,
	}

	ctx, stop := signal.NotifyContext(ctx, syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	serverErr := make(chan error, 1)
	go func() {
		logger.Info().Str("path", cfg.MetricsPath).Msg("starting HTTP server")
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErr <- err
			return
		}
		serverErr <- nil
	}()

	ticker := time.NewTicker(cfg.ScrapeInterval)
	defer ticker.Stop()
	lastMQTTPublish := time.Time{}

	collectOnce := func() {
		snapshot, collectErr := dockerCollector.Collect(ctx)
		if hostCollector != nil {
			hostSnapshot, hostErr := hostCollector.Collect(ctx)
			if hostErr != nil {
				collectErr = errors.Join(collectErr, hostErr)
			} else {
				snapshot.Host = &hostSnapshot
			}
		}
		if snapshot.Host != nil {
			snapshot.Host.Name = preferredHostName(snapshot.Host.Name, cfg.HostNameOverride)
		}
		metrics.Update(snapshot, collectErr)
		if collectErr != nil {
			logger.Error().Err(collectErr).Msg("collection failed")
			return
		}
		state.Set(snapshot)

		if publisher != nil && (lastMQTTPublish.IsZero() || time.Since(lastMQTTPublish) >= cfg.MQTTInterval) {
			if err := publisher.PublishSnapshot(snapshot); err != nil {
				if errors.Is(err, mqttoutput.ErrNotConnected) {
					logger.Warn().Err(err).Msg("MQTT broker is not connected; skipping snapshot publish")
				} else {
					logger.Error().Err(err).Msg("failed to publish snapshot to MQTT")
				}
			} else {
				lastMQTTPublish = time.Now()
			}
		}
	}

	collectOnce()

	for {
		select {
		case <-ctx.Done():
			shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			return server.Shutdown(shutdownCtx)
		case err := <-serverErr:
			return err
		case <-ticker.C:
			collectOnce()
		}
	}
}

func parseFlexibleDuration(raw string) (time.Duration, error) {
	value := strings.TrimSpace(raw)
	if value == "" {
		return 0, fmt.Errorf("value is empty")
	}
	if seconds, err := strconv.Atoi(value); err == nil {
		return time.Duration(seconds) * time.Second, nil
	}
	duration, err := time.ParseDuration(value)
	if err != nil {
		return 0, fmt.Errorf("use Go duration format like 15s or plain seconds like 60")
	}
	return duration, nil
}

func pollCount(window time.Duration, interval time.Duration) int {
	if interval <= 0 {
		return 2
	}
	count := int((window + interval - 1) / interval)
	if count < 2 {
		return 2
	}
	return count
}

func preferredHostName(current string, override string) string {
	if value := strings.TrimSpace(override); value != "" {
		return value
	}
	return current
}

func parseFilesystemMounts(raw string) ([]hostcollector.FilesystemMount, error) {
	value := strings.TrimSpace(raw)
	if value == "" {
		return nil, nil
	}

	parts := strings.Split(value, ",")
	result := make([]hostcollector.FilesystemMount, 0, len(parts))
	for _, part := range parts {
		item := strings.TrimSpace(part)
		if item == "" {
			continue
		}

		pieces := strings.SplitN(item, ":", 2)
		if len(pieces) != 2 {
			return nil, fmt.Errorf("invalid mapping %q, expected host_path:container_path", item)
		}
		name := strings.TrimSpace(pieces[0])
		containerPath := strings.TrimSpace(pieces[1])
		if name == "" || containerPath == "" {
			return nil, fmt.Errorf("invalid mapping %q, host and container paths must be set", item)
		}
		result = append(result, hostcollector.FilesystemMount{
			Name:          name,
			ContainerPath: containerPath,
		})
	}
	return result, nil
}

func parseCSV(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return nil
	}

	parts := strings.Split(raw, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed == "" {
			continue
		}
		result = append(result, trimmed)
	}
	return result
}

func parseNameOverrides(raw string) (map[string]string, error) {
	if strings.TrimSpace(raw) == "" {
		return nil, nil
	}

	result := map[string]string{}
	for _, part := range strings.Split(raw, ",") {
		item := strings.TrimSpace(part)
		if item == "" {
			continue
		}
		id, name, ok := strings.Cut(item, ":")
		if !ok {
			return nil, fmt.Errorf("invalid mapping %q, expected ugos_vm_id:display_name", item)
		}
		id = strings.TrimSpace(id)
		name = strings.TrimSpace(name)
		if id == "" || name == "" {
			return nil, fmt.Errorf("invalid mapping %q, id and display name must be set", item)
		}
		result[id] = name
	}
	return result, nil
}

func handleProcessesAPI(w http.ResponseWriter, r *http.Request, state *snapshotStore) {
	snapshot, ok := state.Get()
	if !ok || snapshot.Host == nil {
		http.Error(w, "host process data is not available yet", http.StatusServiceUnavailable)
		return
	}

	limit := clampLimit(r.URL.Query().Get("limit"), 10, 100)
	sortMode := normalizeProcessSort(r.URL.Query().Get("sort"))
	processes := sortProcesses(snapshot.Host.Processes, sortMode)
	if len(processes) > limit {
		processes = processes[:limit]
	}

	payload := map[string]any{
		"host":         snapshot.Host.Name,
		"collected_at": snapshot.CollectedAt,
		"sort":         sortMode,
		"limit":        limit,
		"processes":    processes,
	}

	w.Header().Set("Content-Type", "application/json")
	encoder := json.NewEncoder(w)
	encoder.SetIndent("", "  ")
	_ = encoder.Encode(payload)
}

func handleVirtualMachinesAPI(w http.ResponseWriter, _ *http.Request, state *snapshotStore) {
	snapshot, ok := state.Get()
	if !ok || snapshot.Host == nil {
		http.Error(w, "host virtual machine data is not available yet", http.StatusServiceUnavailable)
		return
	}

	payload := map[string]any{
		"host":         snapshot.Host.Name,
		"collected_at": snapshot.CollectedAt,
		"vms":          snapshot.Host.VMs,
	}

	w.Header().Set("Content-Type", "application/json")
	encoder := json.NewEncoder(w)
	encoder.SetIndent("", "  ")
	_ = encoder.Encode(payload)
}

func clampLimit(raw string, fallback int, max int) int {
	value := fallback
	if trimmed := strings.TrimSpace(raw); trimmed != "" {
		if parsed, err := strconv.Atoi(trimmed); err == nil {
			value = parsed
		}
	}
	if value < 1 {
		return fallback
	}
	if value > max {
		return max
	}
	return value
}

func normalizeProcessSort(raw string) string {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "ram", "memory", "mem":
		return "memory"
	case "time", "cpu_time":
		return "time"
	case "name":
		return "name"
	default:
		return "cpu"
	}
}

func sortProcesses(processes []model.ProcessSnapshot, sortMode string) []model.ProcessSnapshot {
	result := append([]model.ProcessSnapshot(nil), processes...)
	switch sortMode {
	case "memory":
		sort.Slice(result, func(i, j int) bool {
			if result[i].MemoryBytes == result[j].MemoryBytes {
				return result[i].Name < result[j].Name
			}
			return result[i].MemoryBytes > result[j].MemoryBytes
		})
	case "time":
		sort.Slice(result, func(i, j int) bool {
			if result[i].CPUTimeSeconds == result[j].CPUTimeSeconds {
				return result[i].Name < result[j].Name
			}
			return result[i].CPUTimeSeconds > result[j].CPUTimeSeconds
		})
	case "name":
		sort.Slice(result, func(i, j int) bool {
			return result[i].Name < result[j].Name
		})
	default:
		sort.Slice(result, func(i, j int) bool {
			if result[i].CPUPercent == result[j].CPUPercent {
				if result[i].MemoryBytes == result[j].MemoryBytes {
					return result[i].Name < result[j].Name
				}
				return result[i].MemoryBytes > result[j].MemoryBytes
			}
			return result[i].CPUPercent > result[j].CPUPercent
		})
	}
	return result
}
