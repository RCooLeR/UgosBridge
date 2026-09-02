# Changelog

## [Unreleased]

## [1.0.4] - 2026-09-02

This patch modernizes the bridge, container, card, and release toolchains;
hardens container deployment and supply-chain metadata; and improves Home
Assistant numeric presentation without changing raw telemetry or public metric
contracts.

### Added

- A native `ugos-bridge healthcheck` command and container health checks that
  do not require `curl` or `wget` in the runtime image.
- Weekly Dependabot coverage for Go modules, npm workspaces, Docker images,
  and GitHub Actions.
- Pinned Go vulnerability scanning in CI through the module's Go tool
  dependency.
- Reproducible release timestamps, OCI metadata, image SBOMs, BuildKit
  provenance, and GitHub artifact attestations.
- Container build validation and a hardened-container smoke test in CI.

### Changed

- Upgraded the bridge to Go 1.27 and current Go dependencies, including the
  `urfave/cli` v3 API and `sync.WaitGroup.Go`.
- Consolidated the duplicate root and bridge Go modules into the single
  `bridge` module.
- Consolidated both Home Assistant cards into one npm workspace and lockfile.
- Upgraded the card toolchain to TypeScript 7 and Vite 8's native
  Rolldown/Oxc pipeline, and enabled additional strict type checks.
- Upgraded card runtime dependencies to Lit 3.3.3 and Simple Icons 16.28.0.
- Upgraded the build image to Go 1.27 on Alpine 3.24 and the runtime image to
  Debian 13.6, with recorded multi-platform image digests.
- Modernized Docker builds with cross-compilation, BuildKit cache mounts,
  linked copies, image metadata, and a graceful stop signal.
- Hardened the Compose example with a read-only filesystem, dropped Linux
  capabilities, `no-new-privileges`, PID limits, an init process, and a
  bounded temporary filesystem.
- Updated GitHub Actions and Docker actions to their current Node 24-based
  releases and pinned every action to an immutable commit.

### Fixed

- Home Assistant MQTT discovery now supplies entity-specific display precision,
  preventing excessive decimal places in the UI while preserving full MQTT
  values for history, statistics, templates, and automations ([#1]).

### Compatibility

- No Prometheus metric names, types, labels, or sample values changed. The
  exporter continues to expose raw floating-point precision; dashboard display
  rounding belongs in Grafana or PromQL.
- No Home Assistant MQTT state topics or raw state values were removed, renamed,
  or rounded. The new discovery property is additive.
- Published container images remain available for Linux AMD64 and ARM64.
- Source builds now use Go 1.27, and the runtime image is based on Debian 13.6.

### Upgrade

- Pull `rcooler/ugos-bridge:1.0.4` or rebuild the bridge from the tagged source.
- Restart the bridge so retained Home Assistant discovery payloads are
  republished with the display-precision suggestions.
- Refresh both bundled Home Assistant card resources after upgrading.

## [1.0.3] - 2026-08-05

This release makes Home Assistant data resilient across bridge and container
rebuilds, adds NUT UPS monitoring, and restores complete NAS card telemetry.

### Added

- Optional NUT UPS collection for status, battery, runtime, load, voltage,
  frequency, temperature, and available power values.
- UPS metrics in Prometheus and UPS sensors and binary sensors in Home
  Assistant.
- Configurable rolling temperature averaging, with a default window of two
  minutes, to reduce alerts caused by brief sensor spikes.
- CI coverage for Go tests, race detection, card builds, committed bundles, and
  GoReleaser snapshots.
- Security-patched card build dependencies with zero reported npm audit
  vulnerabilities.

### Changed

- Home Assistant entities now publish scalar state topics and compact attribute
  topics instead of attaching the complete host snapshot to every entity.
- MQTT discovery, state, attributes, and availability are published only when
  their useful values change.
- MQTT reconnects replay retained discovery and state atomically before the
  bridge is marked online.
- Missing entities use an unavailable grace period before discovery is removed.
- Per-process Home Assistant entities are opt-in through
  `UGOS_BRIDGE_MQTT_PROCESS_ALLOWLIST`; process metrics remain available in
  Prometheus.
- Disk identities use a serial number or normalized sysfs path for Home
  Assistant rather than an unstable enumeration position.
- Temperature metrics report the configured rolling average. Set
  `UGOS_BRIDGE_HOST_TEMPERATURE_AVERAGE_WINDOW=0s` for raw samples.

### Fixed

- Prevented CPU, RAM, GPU, Docker project, storage, and network entities from
  disappearing after bridge container rebuilds.
- Corrected System Load percentage, progress, severity, and process-detail
  behavior in the bundled cards.
- Restored Docker project and virtual-machine child discovery and details.
- Restored storage pool, drive, GPU, and network information in both NAS cards.
- Restored the selected-project desktop layout with storage and containers side
  by side while retaining responsive mobile stacking.
- Prevented NVMe data from moving between Home Assistant disk entities when
  kernel enumeration changes.
- Normalized incorrectly scaled NUT battery voltages and suppressed implausible
  AC output-voltage readings.

### Compatibility

- Prometheus has no removed or renamed metrics and no label-key changes in this
  release. The new `ugos_bridge_host_ups_*` metrics are additive.
- `ugos_bridge_host_load_average` remains a raw Linux load average, not a
  percentage.
- `ugos_bridge_host_ups_power_watts{type="nominal_real"}` is rated UPS
  capacity, not live power consumption.
- Prometheus container series retain the runtime `container_id` label, and disk
  series retain the kernel `disk` label. Recreated containers or renamed kernel
  devices can therefore create new Prometheus time series.
- A stable host name is required. Configure `UGOS_BRIDGE_HOST_NAME` or mount the
  host hostname file rather than relying on a Docker container hostname.
- Third-party MQTT consumers using the previous shared JSON state topics must
  migrate to the scalar entity topics. The bundled cards support the current
  contract.
- `UGOS_BRIDGE_MQTT_ENTITY_GRACE` replaces
  `UGOS_BRIDGE_MQTT_EXPIRE_AFTER`; the previous variable remains accepted as an
  alias.

### Upgrade

- Pull or rebuild the bridge image to install the included `nut-client`.
- Keep `UGOS_BRIDGE_HOST_NAME`, `UGOS_BRIDGE_MQTT_CLIENT_ID`, and
  `UGOS_BRIDGE_MQTT_TOPIC_PREFIX` stable across rebuilds.
- Refresh the bundled detailed and compact Home Assistant card resources after
  deployment.

[Unreleased]: https://github.com/RCooLeR/UgosBridge/compare/v1.0.4...HEAD
[1.0.4]: https://github.com/RCooLeR/UgosBridge/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/RCooLeR/UgosBridge/compare/v1.0.2...v1.0.3

[#1]: https://github.com/RCooLeR/UgosBridge/issues/1
