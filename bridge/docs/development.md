# Development and Releases

[Bridge documentation](index.md)

Run the commands below from the repository root unless stated otherwise.
Use isolated test inputs; do not start a development bridge against a production
MQTT broker, where retained topics and client IDs can collide with the NAS instance.

## Components and Build Paths

- `bridge/` is the Go module. `main.go` wires configuration, collection, and HTTP;
  `internal/collectors/` reads sources, `internal/model/` carries snapshots, and
  `internal/metrics/` and `internal/hamqtt/` publish the two output formats.
  `metrics.New` registers the Prometheus gauges; `hamqtt.NewPublisher` accepts a
  `hamqtt.Config` and creates the Home Assistant MQTT publisher. Both packages
  consume `model.Snapshot` and remain part of the same Go module.
- `ha-cards/` is the npm workspace. Its `detailed/` and `small/` packages produce
  two independent browser bundles; the mini card reuses the detailed card's model.
  See [card development](../../ha-cards/README.md).
- Both Dockerfiles, Compose, CI, and GoReleaser use the existing `bridge/` and
  card bundle paths. Source Docker builds use the repository root as context,
  not the `bridge/` directory.

## Bridge Checks

Use a Go toolchain satisfying [go.mod](../go.mod), including its patch version.

```bash
go -C bridge mod tidy -diff
go -C bridge vet ./...
go -C bridge test ./...
go -C bridge tool govulncheck ./...
go -C bridge build -trimpath ./...
```

Run `go -C bridge test -race ./...` on Linux with a C compiler. Host collector
tests are Linux-only; a Windows test run does not exercise them. Non-Linux builds
use a host collector stub and cannot provide NAS host telemetry.

## Local Container Checks

These commands validate or build the local checkout; they do not update the NAS.

```bash
docker compose -f bridge/docker-compose.example.yml config --quiet
docker buildx build --check --file bridge/Dockerfile .
docker buildx build --check --file bridge/Dockerfile.goreleaser .
docker buildx build --load --tag ugos-bridge:local --file bridge/Dockerfile .
```

The source Dockerfile defaults to version `dev`. Release metadata can be supplied
with `--build-arg VERSION=...`, `--build-arg COMMIT=...`, and `--build-arg DATE=...`.
The release Dockerfile wraps binaries already built by GoReleaser.

## CI

`master` is the default branch. The required checks are `bridge`, `cards`,
`container`, and `release-snapshot`: Go tests and race detection, dependency
audits, card checks and committed-bundle reproducibility, a hardened container
smoke test, and release packaging. Changes must be up to date with `master`;
force pushes and deletion of `master` are disabled.

The workflow definitions are [ci.yml](../../.github/workflows/ci.yml) and
[release.yml](../../.github/workflows/release.yml). Keep their required job names
and published artifact paths stable.

## Releases

[GoReleaser configuration](../../.goreleaser.yml) builds Linux amd64 and arm64
binaries, archives, checksums, and both Docker image names. Release assets also
include the two committed HA card bundles. Rebuild and verify those bundles
before preparing a release.

With GoReleaser v2.19.0 and a local multi-platform Docker builder, a snapshot can
be checked without publishing:

```bash
goreleaser release --snapshot
```

GoReleaser writes to `dist/`; use a clean checkout or an unused output directory.
A pushed `vX.Y.Z` tag starts the publishing workflow, creates a GitHub release,
and publishes both `rcooler/ugos-bridge` and `rcooler/ugos-exporter`. A stable
release updates `X.Y.Z`, `X.Y`, `X`, and `latest`; snapshots do not publish.
Pushing `master` runs CI, not a release. The Docker Hub listing text is maintained
in [docker-hub.md](docker-hub.md) and is not uploaded by the release workflow.

NAS updates are a separate file-copy handoff. Preserve the deployment's Compose,
environment, and host mappings; the operator rebuilds/recreates the container
and confirms runtime results. Card bundle installation is documented in
[HA cards](../../ha-cards/README.md).
