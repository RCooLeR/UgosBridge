# Data Collection

`ugos-bridge` collects one snapshot on each scrape interval. The same snapshot is
used for Prometheus, the JSON APIs, and MQTT/Home Assistant publishing.

Default interval:

```text
15s
```

Configure it with:

```text
--scrape-interval
UGOS_BRIDGE_SCRAPE_INTERVAL
```

## Runtime Modes

Docker-only mode only needs Docker Engine API access.

Full NAS mode also enables host collection from mounted host filesystems and
best-effort VM collection through libvirt.

MQTT/Home Assistant is optional and uses the current snapshot on its own publish
interval.

## Docker Data

The bridge talks directly to the Docker Engine API.

Default endpoint:

```text
unix:///var/run/docker.sock
```

Configure it with:

```text
--docker-host
UGOS_BRIDGE_DOCKER_HOST
```

Supported schemes:

- `unix://`
- `tcp://`
- `http://`
- `https://`

`npipe://` is not implemented.

For each container, the bridge collects:

- container ID, name, image, state, and status
- running state
- CPU usage percent
- memory usage bytes
- memory limit bytes
- Compose project membership

Project grouping uses the Docker label:

```text
com.docker.compose.project
```

Configure that with:

```text
--project-label
UGOS_BRIDGE_PROJECT_LABEL
```

Containers without the label are grouped under:

```text
standalone
```

Configure that with:

```text
--standalone-project-name
UGOS_BRIDGE_STANDALONE_PROJECT_NAME
```

## Detailed Container Stats

Detailed stats are disabled by default.

Enable them with:

```text
--detailed-container-stats
UGOS_BRIDGE_DETAILED_CONTAINER_STATS=true
DETAILED_CONTAINER_STATS=true
```

When enabled, the bridge performs extra Docker API calls and exposes more
cAdvisor-style data:

- raw CPU time, user CPU time, system CPU time
- CFS period, quota, share, and throttling data
- raw memory, working set, RSS, cache, swap, max usage, and fail count
- network bytes, packets, errors, and drops by container interface
- block I/O bytes, operations, and time
- PID count
- OOM killed and OOM event state
- start time and Docker health status
- writable layer and rootfs sizes when Docker exposes them

Concurrency is controlled by:

```text
--container-concurrency
UGOS_BRIDGE_CONTAINER_CONCURRENCY
```

Default:

```text
4
```

## Host Data

Host metrics are disabled by default.

Enable them with:

```text
--host-metrics-enabled
UGOS_BRIDGE_HOST_METRICS_ENABLED=true
```

Recommended container mounts:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
  - /proc:/host/proc:ro
  - /sys:/host/sys:ro
  - /:/rootfs:ro
  - /volume1:/volume1:ro
  - /volume2:/volume2:ro
  - /var/run/libvirt:/var/run/libvirt:ro
  - /dev/dri:/dev/dri
```

Configure host paths with:

| Setting | Default | Purpose |
| --- | --- | --- |
| `UGOS_BRIDGE_HOST_PROCFS` | `/host/proc` | Mounted host procfs. |
| `UGOS_BRIDGE_HOST_SYSFS` | `/host/sys` | Mounted host sysfs. |
| `UGOS_BRIDGE_HOST_HOSTNAME_PATH` | `/rootfs/etc/hostname` | Host hostname file. |
| `UGOS_BRIDGE_HOST_FILESYSTEMS` | `/:/rootfs,/volume1:/volume1,/volume2:/volume2` | Host mountpoint to container path mapping. |
| `UGOS_BRIDGE_HOST_NETWORK_INCLUDE` | `eth.*,bond.*` | Interface include regex list. |
| `UGOS_BRIDGE_HOST_DRI_PATH` | `/dev/dri` | Mounted DRM device path for GPU discovery. |
| `UGOS_BRIDGE_HOST_TEMPERATURE_AVERAGE_WINDOW` | `2m` | Rolling window used to smooth temperature sensors. Set `0s` to publish raw readings. |
| `UGOS_BRIDGE_HOST_UPS_ENABLED` | `false` | Enable UPS collection through NUT `upsc`. |
| `UGOS_BRIDGE_HOST_UPS_COMMAND` | `upsc` | UPS command to execute. |
| `UGOS_BRIDGE_HOST_UPS_TARGETS` | | Comma-separated UPS targets such as `ups@localhost`. When empty, the bridge runs `upsc -l`. |
| `UGOS_BRIDGE_HOST_UPS_TIMEOUT` | `3s` | Timeout for each UPS command. |

Set `UGOS_BRIDGE_HOST_NAME` if the hostname inside the container is not the NAS
hostname you want in metrics and Home Assistant.

## CPU And Memory

CPU and process data comes from procfs:

- `/proc/stat`
- `/proc/loadavg`
- `/proc/uptime`
- `/proc/<pid>/stat`
- `/proc/<pid>/cmdline`
- `/proc/<pid>/comm`

CPU frequency and governor data comes from sysfs when the kernel exposes it:

```text
/sys/devices/system/cpu/cpu*/cpufreq
```

Memory and swap values come from:

```text
/proc/meminfo
```

## Filesystems

Filesystems are collected from the configured
`host_mountpoint:container_path` list.

Example:

```text
/:/rootfs,/volume1:/volume1,/volume2:/volume2
```

For each configured filesystem, the bridge collects:

- host mountpoint name
- source device
- filesystem type
- total, used, free, and available bytes
- inode counts
- read-only state
- md array association when the source maps to `/dev/md*`

## Physical Disks

Disk data comes from sysfs block devices. The bridge skips non-physical helper
devices where possible and collects:

- disk name
- vendor, model, serial, media type
- size bytes
- rotational flag
- read and write counters
- read and write throughput
- read and write IOPS
- busy percent

Disk temperatures are collected through hardware sensor discovery when sysfs
exposes a relationship between a sensor and a disk.

## Arrays And Storage Pools

MD array data comes from sysfs and md metadata. The bridge collects:

- array name, level, and state
- array size
- active, total, failed, spare, and degraded disk counts
- sync action and sync completion percent
- members and mountpoints

Linear md arrays are reported with level `linear` from Linux. Home Assistant
cards may display that as JBOD.

## Network Interfaces

Network data comes from:

```text
/sys/class/net
```

The include regex defaults to:

```text
eth.*,bond.*
```

This intentionally excludes common virtual interfaces such as `docker*`,
`veth*`, and bridge devices. Use `.*` if you want every interface.

For each interface, the bridge collects:

- name, MAC, MTU, operational state, duplex, carrier
- link speed
- RX/TX byte counters and throughput
- RX/TX packets, errors, and drops
- bond master relationship when present

Bond interfaces additionally expose:

- mode
- active slave
- primary slave
- MII status
- slave count
- per-slave speed, carrier, active state, duplex, and status

## GPU Data

Basic GPU discovery reads DRM/sysfs data from the configured DRI path:

```text
UGOS_BRIDGE_HOST_DRI_PATH=/dev/dri
```

The bridge collects available GPU metadata, frequency data, and busy percent
when the driver exposes it.

Optional Intel GPU telemetry uses `intel_gpu_top`.

Enable it with:

```text
UGOS_BRIDGE_HOST_INTEL_GPU_TOP_ENABLED=true
UGOS_BRIDGE_HOST_INTEL_GPU_TOP_DEVICE=drm:/dev/dri/renderD128
UGOS_BRIDGE_HOST_INTEL_GPU_TOP_PERIOD=1s
```

On many hosts this requires:

```yaml
privileged: true
pid: host
```

Intel GPU data can include engine load, requested/actual frequency, IMC
bandwidth, interrupts, package/GPU power, and RC6 percent.

## Hardware Health And Cooling

Temperature and fan data comes from:

- `/sys/class/hwmon`
- `/sys/class/thermal/thermal_zone*`

Temperature readings are exported as a rolling average over
`UGOS_BRIDGE_HOST_TEMPERATURE_AVERAGE_WINDOW` to avoid short hardware sensor
spikes creating noisy alerts. Fan readings remain raw.

Cooling-device state comes from:

```text
/sys/class/thermal/cooling_device*
```

Cooling percentage is calculated only when a cooling device exposes a valid
maximum state.

## UPS Data

UPS monitoring is optional and uses Network UPS Tools through the `upsc`
command.

Enable it with:

```text
UGOS_BRIDGE_HOST_UPS_ENABLED=true
UGOS_BRIDGE_HOST_UPS_TARGETS=ups@host.docker.internal
```

If `UGOS_BRIDGE_HOST_UPS_TARGETS` is empty, the bridge asks `upsc -l` for local
UPS names and then reads each one. Configure explicit targets when the UPS
server is remote or when automatic listing is not available. Use
`ups@localhost` only when the bridge shares the host network namespace or when
the NUT server runs in the same container. On Linux Docker, add
`host.docker.internal:host-gateway` to `extra_hosts` or use the NAS host IP.

For each UPS, the bridge publishes available identity, status, battery charge,
runtime, voltages, load, real power, line frequency, and temperature values.
Online, on-battery, and low-battery status are also exported as boolean metrics
and Home Assistant binary sensors.

Some NUT drivers expose scaled or placeholder voltage values. The bridge
normalizes low battery voltages such as `1.3` to `13V` for drivers that also
report low nominal battery voltage values such as `1.2`, while still suppressing
implausible AC input or output voltages.

## Virtual Machines

VM collection is enabled by default when host metrics are enabled.

Configure it with:

```text
UGOS_BRIDGE_HOST_VMS_ENABLED=true
UGOS_BRIDGE_HOST_VIRSH_PATH=virsh
UGOS_BRIDGE_HOST_VIRSH_URI=qemu:///system
UGOS_BRIDGE_HOST_VIRSH_TIMEOUT=3s
```

The container must be able to run `virsh` and access libvirt, usually through:

```yaml
volumes:
  - /var/run/libvirt:/var/run/libvirt:ro
```

The collector is best-effort. If `virsh` or libvirt is unavailable, VM data is
skipped without failing the whole scrape.

For each VM, the bridge collects:

- UGOS/libvirt domain ID
- display name
- source ISO/disk-derived name
- running state
- vCPU count
- CPU percent and CPU time
- memory values
- aggregate disk read/write counters
- aggregate network RX/TX counters
- ISO path and disk paths

VM memory has multiple meanings. `memory_usage_bytes` is actual guest RAM usage
when libvirt balloon `available` and `unused` stats are present; otherwise it
falls back to current assigned memory. `memory_current_bytes` is current assigned
memory, and `max_memory_bytes` is the configured maximum. Stopped VMs report
`memory_usage_bytes` as `0`; assigned and maximum memory remain available as
capacity fields.

Display names default to the attached ISO filename without extension, then the
first disk image filename, then the UGOS/libvirt ID. Override display names with:

```text
UGOS_BRIDGE_VM_NAMES=ugos-app-vm-id-1:Windows 11,ugos-app-vm-id-2:Ubuntu Server
```

## HTTP APIs

The metrics server exposes:

```text
/metrics
/api/processes
/api/vms
```

Process API examples:

```bash
curl http://localhost:9877/api/processes
curl http://localhost:9877/api/processes?sort=memory&limit=10
curl http://localhost:9877/api/processes?sort=time&limit=25
```

VM API example:

```bash
curl http://localhost:9877/api/vms
```

## Minimal Docker Compose

```yaml
services:
  ugos-bridge:
    image: rcooler/ugos-bridge:latest
    container_name: ugos-bridge
    restart: unless-stopped
    ports:
      - "9877:9877"
    environment:
      UGOS_BRIDGE_DOCKER_HOST: "unix:///var/run/docker.sock"
      UGOS_BRIDGE_SCRAPE_INTERVAL: "15s"
      UGOS_BRIDGE_HOST_METRICS_ENABLED: "true"
      UGOS_BRIDGE_HOST_PROCFS: "/host/proc"
      UGOS_BRIDGE_HOST_SYSFS: "/host/sys"
      UGOS_BRIDGE_HOST_NAME: "ugreen-nas"
      UGOS_BRIDGE_HOST_HOSTNAME_PATH: "/rootfs/etc/hostname"
      UGOS_BRIDGE_HOST_FILESYSTEMS: "/:/rootfs,/volume1:/volume1,/volume2:/volume2"
      UGOS_BRIDGE_HOST_DRI_PATH: "/dev/dri"
      UGOS_BRIDGE_HOST_VMS_ENABLED: "true"
      UGOS_BRIDGE_HOST_VIRSH_URI: "qemu:///system"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
      - /volume1:/volume1:ro
      - /volume2:/volume2:ro
      - /var/run/libvirt:/var/run/libvirt:ro
      - /dev/dri:/dev/dri
```

The repository also includes [bridge/docker-compose.example.yml](../bridge/docker-compose.example.yml).
