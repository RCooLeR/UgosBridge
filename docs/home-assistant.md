# Home Assistant Sensors And Devices

This guide describes what `ugos-bridge` creates in Home Assistant when MQTT
publishing is enabled: devices, sensors, binary sensors, topics, and generated
IDs.

Home Assistant support is implemented with MQTT discovery. The bridge publishes
scalar entity states, compact JSON attribute messages, and discovery config
messages. Home Assistant creates devices and entities from those discovery
messages.

## Required Configuration

MQTT and discovery are controlled by these settings:

| Setting | Default | Purpose |
| --- | --- | --- |
| `UGOS_BRIDGE_MQTT_ENABLED` | `false` | Enables MQTT publishing and Home Assistant discovery. |
| `UGOS_BRIDGE_MQTT_BROKER` | none | MQTT broker URL, for example `tcp://homeassistant.local:1883`. |
| `UGOS_BRIDGE_MQTT_TOPIC_PREFIX` | `ugos_bridge` | Prefix for bridge state and availability topics. |
| `UGOS_BRIDGE_MQTT_DISCOVERY_PREFIX` | `homeassistant` | Home Assistant MQTT discovery prefix. |
| `UGOS_BRIDGE_MQTT_RETAIN` | `true` | Retain flag used for state, attributes, and discovery publishes. |
| `UGOS_BRIDGE_MQTT_PROCESS_ALLOWLIST` | empty | Comma-separated process group names/slugs to publish to MQTT. Process metrics remain available in Prometheus when empty. |
| `UGOS_BRIDGE_MQTT_ENTITY_GRACE` | `45s` | How long an entity may be absent from snapshots before it is marked unavailable. The old `UGOS_BRIDGE_MQTT_EXPIRE_AFTER` name remains an alias. |

Host, storage, network, GPU, UPS, cooling, health, process, and VM devices only appear
when host metrics are enabled and the related data is available. Docker project
and container devices appear in Docker-only mode.

## MQTT Topics

With the default topic prefix `ugos_bridge`, the bridge publishes availability to:

```text
ugos_bridge/status
```

The retained Last Will payload is `offline`. When connected, the bridge publishes
a process-lifetime payload such as `online_a1b2c3d4e5f6`. A new payload is used
after every bridge restart so retained discovery from an older process cannot
incorrectly become available again. A connection first publishes an `offline`
barrier, replays every current discovery, attributes, entity-availability, and
state payload, and publishes the process-lifetime online payload last. Home
Assistant therefore never sees a partially replayed bridge generation as
available.

Each entity also has its own availability topic. Discovery requires both the
bridge session and the entity to be available:

```json
"availability": [
  {
    "topic": "ugos_bridge/status",
    "payload_available": "online_a1b2c3d4e5f6",
    "payload_not_available": "offline"
  },
  {
    "topic": "<entity_base>/availability",
    "payload_available": "online",
    "payload_not_available": "offline"
  }
],
"availability_mode": "all"
```

Each entity has a scalar state topic. Related entities no longer share a full
JSON state payload:

| Data | State topic pattern |
| --- | --- |
| Host summary | `<topic_prefix>/host/<object_id>/state` |
| Docker project | `<topic_prefix>/projects/<project_slug>/<object_id>/state` |
| Docker container | `<topic_prefix>/containers/<container_slug>/<object_id>/state` |
| Virtual machine | `<topic_prefix>/virtual_machines/<vm_id_slug>/<object_id>/state` |
| Process group | `<topic_prefix>/host/processes/<process_slug>/<object_id>/state` |
| Filesystem | `<topic_prefix>/host/filesystems/<filesystem_slug>/<object_id>/state` |
| Physical disk | `<topic_prefix>/host/disks/<disk_identity>/<object_id>/state` |
| Array / storage pool | `<topic_prefix>/host/arrays/<array_slug>/<object_id>/state` |
| Bond interface | `<topic_prefix>/host/bonds/<bond_slug>/<object_id>/state` |
| Bond slave interface | `<topic_prefix>/host/bonds/<bond_slug>/slaves/<slave_slug>/<object_id>/state` |
| Network interface | `<topic_prefix>/host/networks/<network_slug>/<object_id>/state` |
| GPU | `<topic_prefix>/host/gpus/<gpu_slug>/<object_id>/state` |
| Hardware health sensor | `<topic_prefix>/host/sensors/<sensor_slug>/<object_id>/state` |
| Cooling device | `<topic_prefix>/host/cooling/<cooling_slug>/<object_id>/state` |
| UPS | `<topic_prefix>/host/ups/<ups_slug>/<object_id>/state` |

Compact metadata and card-detail attributes use the same base with
`/attributes`. Only a representative entity subscribes to attributes for most
device groups. `collected_at` is never included, and state is published only
when that entity's scalar value changes.

Numeric discovery payloads include a suggested display precision where the
source can produce fractional values. Home Assistant uses the suggestion for
presentation and users can override it per entity. The MQTT state remains at
its original precision so dashboards are concise without reducing the accuracy
available to history, statistics, templates, or automations.

Discovery config topics use this pattern:

```text
<discovery_prefix>/<component>/ugos_bridge_<discovery_slug>/<object_id>/config
```

`component` is either `sensor` or `binary_sensor`.

Example with defaults:

```text
homeassistant/sensor/ugos_bridge_host_dxp6800_pro/cpu_usage_percent/config
homeassistant/binary_sensor/ugos_bridge_container_home_assistant/running/config
```

## Slug Rules

Names from the host, Docker, libvirt, sysfs, and mount table are normalized before
they are used in MQTT topics or Home Assistant IDs.

The slug algorithm is:

1. Trim spaces.
2. Convert to lowercase.
3. Convert `/` exactly to `root`.
4. Replace every run of characters outside `a-z` and `0-9` with `_`.
5. Trim leading and trailing `_`.
6. Use `unknown` if the result is empty.

Examples:

| Input | Slug |
| --- | --- |
| `dxp6800_pro` | `dxp6800_pro` |
| `Home Assistant` | `home_assistant` |
| `/` | `root` |
| `/volume1` | `volume1` |
| `Virtual machines` | `virtual_machines` |
| `Intel iGPU @ 0000:00:02.0` | `intel_igpu_0000_00_02_0` |

## IDs Created In Home Assistant

Every discovery payload contains a Home Assistant device block:

```json
"device": {
  "identifiers": ["<device_id>"],
  "name": "<device_name>",
  "via_device": "<parent_device_id>",
  "manufacturer": "RCooLeR",
  "model": "<model>"
}
```

`via_device` is omitted for top-level devices.

Every numeric sensor uses:

```json
"unique_id": "<entity_id_base>_<object_id>",
"object_id": "<entity_id_base>_<object_id>",
"state_topic": "<entity_base>/<object_id>/state"
```

Selected detail-bearing sensors also use
`"json_attributes_topic": "<entity_base>/attributes"`. Every binary sensor uses
the same scalar state pattern plus its own `payload_on` and `payload_off`; no
JSON `value_template` is required.

In most cases, `<entity_id_base>` is the same as the device ID. Hardware health
sensors use a more specific base so multiple sensors on the same chip do not
collide.

Home Assistant usually derives the final entity ID from `object_id`, for example:

```text
sensor.ugos_bridge_host_dxp6800_pro_cpu_usage_percent
binary_sensor.ugos_bridge_container_home_assistant_running
```

Home Assistant can still change the final entity ID if the user renames an
entity or if a conflict already exists. The stable identifier from the bridge is
`unique_id`.

Host IDs are based on `UGOS_BRIDGE_HOST_NAME` or a mounted host hostname file.
The bridge does not fall back to the container hostname because Docker commonly
sets that value to the replaceable container ID. Docker container entities are
based on the stable container name and Compose project; the runtime container ID
is diagnostic metadata only and may change on every rebuild.

## Device Hierarchy

| Device type | Device ID | Parent |
| --- | --- | --- |
| Host | `ugos_bridge_host_<host_slug>` | none |
| Docker project | `ugos_bridge_project_<project_slug>` | none |
| Virtual machines project | `ugos_bridge_project_virtual_machines` | none |
| Docker container | `ugos_bridge_container_<container_slug>` | Docker project device |
| Virtual machine | `ugos_bridge_vm_<ugos_vm_id_slug>` | Virtual machines project device |
| Process group | `<host_device_id>_process_<process_slug>` | Host device |
| Array / storage pool | `<host_device_id>_array_<array_slug>` | Host device |
| Filesystem | `<host_device_id>_filesystem_<filesystem_slug>` | Array device when `fs.Array` is known, otherwise host device |
| Physical disk | `<host_device_id>_disk_<disk_identity>` | Host device |
| Bond interface | `<host_device_id>_bond_<bond_slug>` | Host device |
| Bond slave interface | `<host_device_id>_bond_<bond_slug>_slave_<slave_slug>` | Bond device |
| Network interface | `<host_device_id>_network_<network_slug>` | Bond device when `network.Master` is known, otherwise host device |
| GPU | `<host_device_id>_gpu_<gpu_slug>` | Host device |
| Hardware health chip | `<host_device_id>_health_<chip_slug>` | Host device |
| Disk health sensor | `<host_device_id>_disk_<disk_identity>` | Host device |
| Cooling device | `<host_device_id>_cooling_<cooling_slug>` | Host device |
| UPS | `<host_device_id>_ups_<ups_slug>` | Host device |

Physical disk identity is `serial_<serial_slug>` when a serial is available,
otherwise `path_<sysfs_path_hash>`, and only falls back to
`name_<kernel_name_slug>` when neither stable value exists. Disk temperature
sensors use the same identity. This prevents `/dev/nvme0n1` reordering from
moving one physical drive's attributes onto another entity. When a stable
identity is available, the bridge also removes the superseded name-based disk
and disk-sensor discovery topics from older releases.

Disk temperature sensors are attached to the disk device when the collector can
map the sysfs sensor to a disk. Otherwise, temperature and fan sensors are grouped
under a hardware health chip device.

## Discovery Lifecycle

The bridge keeps an in-memory set of entities discovered during the current
process lifetime.

- On the first complete snapshot after startup or reconnect, the bridge remains
  globally unavailable while it republishes every current entity, then marks the
  complete generation available in one final publish.
- Discovery, attributes, availability, and scalar state payloads are deduplicated.
- A single missing poll does not remove or mark an entity unavailable.
- After the configured grace period, the entity availability topic changes to
  `offline` while discovery remains present.
- After ten grace periods of continuous absence, discovery, state, and
  entity-availability retained payloads are removed.
- If the entity returns, it is marked online and resumes with the same stable ID.

## Created Entities

The tables below list the entities created for each device type. `Object ID` is
the suffix used in discovery topics, `unique_id`, and `object_id`.

### Host Device

Device ID:

```text
ugos_bridge_host_<host_slug>
```

State topic:

```text
<topic_prefix>/host/<object_id>/state
```

| Entity | Component | Object ID | Value key | Unit | Device class | State class |
| --- | --- | --- | --- | --- | --- | --- |
| CPU | `sensor` | `cpu_usage_percent` | `cpu_usage_percent` | `%` | | `measurement` |
| CPU Frequency | `sensor` | `cpu_frequency_mhz` | `cpu_frequency_mhz` | `MHz` | | `measurement` |
| Load 1m | `sensor` | `load_1` | `load_1` | `%` | | `measurement` |
| Memory Used | `sensor` | `memory_used_bytes` | `memory_used_bytes` | `B` | `data_size` | `measurement` |
| Memory Used | `sensor` | `memory_used_percent` | `memory_used_percent` | `%` | | `measurement` |
| Swap Used | `sensor` | `swap_used_percent` | `swap_used_percent` | `%` | | `measurement` |
| Uptime | `sensor` | `uptime_seconds` | `uptime_seconds` | `s` | `duration` | `measurement` |

The CPU and memory detail entities use a compact host attributes topic carrying
CPU-core details and total/free/available/cached/buffer memory and swap bytes.
It does not duplicate the full host state or include a collection timestamp.
`Load 1m` is exposed as the bridge's one-minute load value and displayed as a
percent-style gauge by the bundled Lovelace cards.

### Docker Project Devices

Device ID:

```text
ugos_bridge_project_<project_slug>
```

State topic:

```text
<topic_prefix>/projects/<project_slug>/<object_id>/state
```

| Entity | Component | Object ID | Value key | Unit | Device class | State class |
| --- | --- | --- | --- | --- | --- | --- |
| CPU | `sensor` | `cpu_usage_percent` | `cpu_usage_percent` | `%` | | `measurement` |
| Memory | `sensor` | `memory_usage_bytes` | `memory_usage_bytes` | `B` | `data_size` | `measurement` |
| Total Containers | `sensor` | `total_containers` | `total_containers` | | | `measurement` |
| Running Containers | `sensor` | `running_containers` | `running_containers` | | | `measurement` |

Project attributes contain project identity only. The bundled card builds child
rows from the individual container or VM entities.

### Docker Container Devices

Device ID:

```text
ugos_bridge_container_<container_slug>
```

Parent:

```text
ugos_bridge_project_<project_slug>
```

State topic:

```text
<topic_prefix>/containers/<container_slug>/<object_id>/state
```

| Entity | Component | Object ID | Value key or template | Unit | Device class | State class |
| --- | --- | --- | --- | --- | --- | --- |
| CPU | `sensor` | `cpu_usage_percent` | `cpu_usage_percent` | `%` | | `measurement` |
| Memory | `sensor` | `memory_usage_bytes` | `memory_usage_bytes` | `B` | `data_size` | `measurement` |
| Running | `sensor` | `running` | `running` | | | `measurement` |
| Running | `binary_sensor` | `running` | scalar `1` / `0` | | | |

The numeric and binary running entities share the same `object_id` suffix but
use different Home Assistant components, so they become `sensor...running` and
`binary_sensor...running`.

### Virtual Machines Project Device

When host VM collection returns at least one VM, the bridge creates a synthetic
project named `Virtual machines`.

Device ID:

```text
ugos_bridge_project_virtual_machines
```

It has the same four entities as a Docker project:

| Entity | Component | Object ID | Value key | Unit | Device class | State class |
| --- | --- | --- | --- | --- | --- | --- |
| CPU | `sensor` | `cpu_usage_percent` | `cpu_usage_percent` | `%` | | `measurement` |
| Memory | `sensor` | `memory_usage_bytes` | `memory_usage_bytes` | `B` | `data_size` | `measurement` |
| Total Containers | `sensor` | `total_containers` | `total_containers` | | | `measurement` |
| Running Containers | `sensor` | `running_containers` | `running_containers` | | | `measurement` |

For this synthetic project, `total_containers` means total VMs and
`running_containers` means running VMs. The bundled card builds VM rows from the
individual VM entities.

### Virtual Machine Devices

Device ID:

```text
ugos_bridge_vm_<ugos_vm_id_slug>
```

Parent:

```text
ugos_bridge_project_virtual_machines
```

State topic:

```text
<topic_prefix>/virtual_machines/<ugos_vm_id_slug>/<object_id>/state
```

| Entity | Component | Object ID | Value key or template | Unit | Device class | State class |
| --- | --- | --- | --- | --- | --- | --- |
| CPU | `sensor` | `cpu_usage_percent` | `cpu_usage_percent` | `%` | | `measurement` |
| Memory Used | `sensor` | `memory_usage_bytes` | `memory_usage_bytes` | `B` | `data_size` | `measurement` |
| Memory Current | `sensor` | `memory_current_bytes` | `memory_current_bytes` | `B` | `data_size` | `measurement` |
| Running | `sensor` | `running` | `running` | | | `measurement` |
| vCPUs | `sensor` | `vcpus` | `vcpus` | | | `measurement` |
| Disk Read | `sensor` | `disk_read_bytes` | `disk_read_bytes` | `B` | `data_size` | `total_increasing` |
| Disk Write | `sensor` | `disk_write_bytes` | `disk_write_bytes` | `B` | `data_size` | `total_increasing` |
| Running | `binary_sensor` | `running` | scalar `1` / `0` | | | |

VM display names come from the VM collector. The collector keeps the UGOS/libvirt
domain ID as `ugos_vm_id`, derives a display name from attached ISO or disk image
paths when possible, and applies `UGOS_BRIDGE_VM_NAMES` overrides last.

`memory_usage_bytes` is the best available actual guest RAM usage. When libvirt
balloon `available` and `unused` stats are present, it is calculated as
`available - unused`; otherwise it falls back to current assigned VM memory.
`memory_current_bytes` is current assigned/balloon memory, and
`memory_limit_bytes` in the JSON attributes is the maximum VM memory. Stopped
VMs publish `memory_usage_bytes` as `0`, while assigned/current and maximum
memory remain in the payload for context.

### Process Group Devices

Process groups are Prometheus-only by default. Set
`UGOS_BRIDGE_MQTT_PROCESS_ALLOWLIST` to a comma-separated list of exact process
names or normalized slugs to create selected Home Assistant process entities.
The host CPU entity still receives a compact `top_processes` attribute containing
up to 10 process groups. The NAS card uses this single list for its System Load
detail view without creating discovery entities for every changing top process.

Device ID:

```text
<host_device_id>_process_<process_slug>
```

Parent:

```text
<host_device_id>
```

State topic:

```text
<topic_prefix>/host/processes/<process_slug>/<object_id>/state
```

| Entity | Component | Object ID | Value key | Unit | Device class | State class |
| --- | --- | --- | --- | --- | --- | --- |
| Process Count | `sensor` | `process_count` | `process_count` | | | `measurement` |
| CPU | `sensor` | `cpu_usage_percent` | `cpu_usage_percent` | `%` | | `measurement` |
| Memory | `sensor` | `memory_usage_bytes` | `memory_usage_bytes` | `B` | `data_size` | `measurement` |
| CPU Time | `sensor` | `cpu_time_seconds` | `cpu_time_seconds` | `s` | | `measurement` |

### Array / Storage Pool Devices

Device ID:

```text
<host_device_id>_array_<array_slug>
```

Parent:

```text
<host_device_id>
```

State topic:

```text
<topic_prefix>/host/arrays/<array_slug>/<object_id>/state
```

| Entity | Component | Object ID | Value key or template | Unit | Device class | State class |
| --- | --- | --- | --- | --- | --- | --- |
| Degraded Disks | `sensor` | `degraded_disks` | `degraded_disks` | | | `measurement` |
| Active Disks | `sensor` | `active_disks` | `active_disks` | | | `measurement` |
| Total Disks | `sensor` | `total_disks` | `total_disks` | | | `measurement` |
| Sync Progress | `sensor` | `sync_completed_percent` | `sync_completed_percent` | `%` | | `measurement` |
| Size | `sensor` | `size_bytes` | `size_bytes` | `B` | `data_size` | `measurement` |
| Level | `sensor` | `level` | `level` | | | |
| Degraded | `binary_sensor` | `degraded` | `ON` when `degraded_disks > 0`, otherwise `OFF` | | `problem` | |

### Filesystem Devices

Device ID:

```text
<host_device_id>_filesystem_<filesystem_slug>
```

Parent:

```text
<host_device_id>_array_<array_slug>
```

when the filesystem is associated with an md array, otherwise:

```text
<host_device_id>
```

State topic:

```text
<topic_prefix>/host/filesystems/<filesystem_slug>/<object_id>/state
```

| Entity | Component | Object ID | Value key or template | Unit | Device class | State class |
| --- | --- | --- | --- | --- | --- | --- |
| Used | `sensor` | `used_bytes` | `used_bytes` | `B` | `data_size` | `measurement` |
| Free | `sensor` | `free_bytes` | `free_bytes` | `B` | `data_size` | `measurement` |
| Used | `sensor` | `used_percent` | `used_percent` | `%` | | `measurement` |
| Read Only | `binary_sensor` | `read_only` | scalar `1` / `0` | | `problem` | |

The root filesystem `/` uses slug `root` when it is collected. UGOS Pro
1.19+ Docker Projects UI deployments normally omit the rejected `/:/rootfs:ro`
bind, and overlay-backed host roots are intentionally skipped, so a `root`
filesystem device is not expected in those deployments. Docker container
rootfs size is an unrelated Prometheus metric,
`ugos_bridge_container_filesystem_size_bytes{type="rootfs"}`, and is unaffected.

### Physical Disk Devices

Device ID:

```text
<host_device_id>_disk_<disk_identity>
```

Parent:

```text
<host_device_id>
```

State topic:

```text
<topic_prefix>/host/disks/<disk_identity>/<object_id>/state
```

| Entity | Component | Object ID | Value key | Unit | Device class | State class |
| --- | --- | --- | --- | --- | --- | --- |
| Read Throughput | `sensor` | `read_bytes_per_second` | `read_bytes_per_second` | `B/s` | `data_rate` | `measurement` |
| Write Throughput | `sensor` | `write_bytes_per_second` | `write_bytes_per_second` | `B/s` | `data_rate` | `measurement` |
| Busy | `sensor` | `busy_percent` | `busy_percent` | `%` | | `measurement` |
| Size | `sensor` | `size_bytes` | `size_bytes` | `B` | `data_size` | `measurement` |
| Model | `sensor` | `model` | `model` | | | |
| Vendor | `sensor` | `vendor` | `vendor` | | | |
| Serial | `sensor` | `serial` | `serial` | | | |
| Media | `sensor` | `media_type` | `type` | | | |

### Bond Interface Devices

Device ID:

```text
<host_device_id>_bond_<bond_slug>
```

Parent:

```text
<host_device_id>
```

State topic:

```text
<topic_prefix>/host/bonds/<bond_slug>/<object_id>/state
```

| Entity | Component | Object ID | Value key or template | Unit | Device class | State class |
| --- | --- | --- | --- | --- | --- | --- |
| Link Speed | `sensor` | `speed_mbps` | `speed_mbps` | `Mbit/s` | | `measurement` |
| Mode | `sensor` | `mode` | `mode` | | | |
| Active Slave | `sensor` | `active_slave` | `active_slave` | | | |
| MII Status | `sensor` | `mii_status` | `mii_status` | | | |
| Slave Count | `sensor` | `slave_count` | `slave_count` | | | `measurement` |
| Carrier | `binary_sensor` | `carrier` | scalar `1` / `0` | | `connectivity` | |

### Bond Slave Interface Devices

Device ID:

```text
<host_device_id>_bond_<bond_slug>_slave_<slave_slug>
```

Parent:

```text
<host_device_id>_bond_<bond_slug>
```

State topic:

```text
<topic_prefix>/host/bonds/<bond_slug>/slaves/<slave_slug>/<object_id>/state
```

| Entity | Component | Object ID | Value key or template | Unit | Device class | State class |
| --- | --- | --- | --- | --- | --- | --- |
| Link Speed | `sensor` | `speed_mbps` | `speed_mbps` | `Mbit/s` | | `measurement` |
| MII Status | `sensor` | `mii_status` | `mii_status` | | | |
| Carrier | `binary_sensor` | `carrier` | scalar `1` / `0` | | `connectivity` | |
| Active | `binary_sensor` | `active` | scalar `1` / `0` | | | |

### Network Interface Devices

Device ID:

```text
<host_device_id>_network_<network_slug>
```

Parent:

```text
<host_device_id>_bond_<master_bond_slug>
```

when the interface has a bond master, otherwise:

```text
<host_device_id>
```

State topic:

```text
<topic_prefix>/host/networks/<network_slug>/<object_id>/state
```

| Entity | Component | Object ID | Value key or template | Unit | Device class | State class |
| --- | --- | --- | --- | --- | --- | --- |
| RX Throughput | `sensor` | `rx_bytes_per_second` | `rx_bytes_per_second` | `B/s` | `data_rate` | `measurement` |
| TX Throughput | `sensor` | `tx_bytes_per_second` | `tx_bytes_per_second` | `B/s` | `data_rate` | `measurement` |
| Link Speed | `sensor` | `speed_mbps` | `speed_mbps` | `Mbit/s` | | `measurement` |
| Carrier | `binary_sensor` | `carrier` | scalar `1` / `0` | | `connectivity` | |

The collector can include or exclude network interfaces with
`UGOS_BRIDGE_HOST_NETWORK_INCLUDE`.

### GPU Devices

Device ID:

```text
<host_device_id>_gpu_<gpu_slug>
```

Parent:

```text
<host_device_id>
```

State topic:

```text
<topic_prefix>/host/gpus/<gpu_slug>/<object_id>/state
```

| Entity | Component | Object ID | Value key | Unit | Device class | State class |
| --- | --- | --- | --- | --- | --- | --- |
| Busy | `sensor` | `busy_percent` | `busy_percent` | `%` | | `measurement` |
| Current Frequency | `sensor` | `current_mhz` | `current_mhz` | `MHz` | | `measurement` |
| Max Frequency | `sensor` | `max_mhz` | `max_mhz` | `MHz` | | `measurement` |

`busy_percent` is created only when the GPU collector marks busy data as
available. Optional `intel_gpu_top` data is exposed as JSON attributes named
`engines` and `stats`; it is not split into separate Home Assistant entities.

### Hardware Health Devices

Generic health device ID:

```text
<host_device_id>_health_<chip_slug>
```

Generic health entity ID base:

```text
<host_device_id>_sensor_<sensor_slug>
```

Disk health device ID:

```text
<host_device_id>_disk_<disk_identity>
```

Disk health entity ID base:

```text
<host_device_id>_disk_<disk_identity>_sensor_<sensor_slug>
```

State topic:

```text
<topic_prefix>/host/sensors/<sensor_slug>/<object_id>/state
```

`sensor_slug` is built from:

```text
<source>_<chip>_<sensor_name>
```

For a disk-associated sensor it is instead:

```text
<source>_<disk_identity>_<chip>_<sensor_name>
```

| Entity | Component | Object ID | Value key | Unit | Device class | State class |
| --- | --- | --- | --- | --- | --- | --- |
| Temperature | `sensor` | `temperature_celsius` | `temperature_celsius` | `°C` | `temperature` | `measurement` |
| Fan Speed | `sensor` | `fan_speed_rpm` | `fan_speed_rpm` | `rpm` | | `measurement` |

Only sensor kinds `temperature` and `fan` are published to Home Assistant.
Temperature values use the same rolling average as Prometheus, controlled by
`UGOS_BRIDGE_HOST_TEMPERATURE_AVERAGE_WINDOW`.

### Cooling Device Devices

Device ID:

```text
<host_device_id>_cooling_<cooling_slug>
```

Parent:

```text
<host_device_id>
```

State topic:

```text
<topic_prefix>/host/cooling/<cooling_slug>/<object_id>/state
```

| Entity | Component | Object ID | Value key | Unit | Device class | State class |
| --- | --- | --- | --- | --- | --- | --- |
| Cooling Level | `sensor` | `cooling_percent` | `cooling_percent` | `%` | | `measurement` |
| Cooling State | `sensor` | `cooling_state` | `cooling_state` | | | `measurement` |
| Cooling Max State | `sensor` | `cooling_max_state` | `cooling_max_state` | | | `measurement` |

`cooling_percent` is created only when the cooling device reports a maximum state
greater than zero.

### UPS Devices

UPS devices are created when `UGOS_BRIDGE_HOST_UPS_ENABLED=true` and the bridge
can read one or more NUT `upsc` targets.

Device ID:

```text
<host_device_id>_ups_<ups_slug>
```

Parent:

```text
<host_device_id>
```

State topic:

```text
<topic_prefix>/host/ups/<ups_slug>/<object_id>/state
```

| Entity | Component | Object ID | Value key or template | Unit | Device class | State class |
| --- | --- | --- | --- | --- | --- | --- |
| Status | `sensor` | `status` | `status` | | | |
| Online | `binary_sensor` | `online` | scalar `1` / `0` | | | |
| On Battery | `binary_sensor` | `on_battery` | scalar `1` / `0` | | | |
| Low Battery | `binary_sensor` | `low_battery` | scalar `1` / `0` | | `problem` | |
| Battery Charge | `sensor` | `battery_charge_percent` | `battery_charge_percent` | `%` | `battery` | `measurement` |
| Battery Runtime | `sensor` | `battery_runtime_seconds` | `battery_runtime_seconds` | `s` | `duration` | `measurement` |
| Battery Voltage | `sensor` | `battery_voltage` | `battery_voltage` | `V` | `voltage` | `measurement` |
| Input Voltage | `sensor` | `input_voltage` | `input_voltage` | `V` | `voltage` | `measurement` |
| Output Voltage | `sensor` | `output_voltage` | `output_voltage` | `V` | `voltage` | `measurement` |
| Load | `sensor` | `load_percent` | `load_percent` | `%` | | `measurement` |
| Real Power | `sensor` | `real_power_watts` | `real_power_watts` | `W` | `power` | `measurement` |
| Nominal Real Power | `sensor` | `nominal_real_power_watts` | `nominal_real_power_watts` | `W` | `power` | `measurement` |
| Line Frequency | `sensor` | `line_frequency_hz` | `line_frequency_hz` | `Hz` | `frequency` | `measurement` |
| Temperature | `sensor` | `temperature_celsius` | `temperature_celsius` | `°C` | `temperature` | `measurement` |

Numeric entities are created only when the UPS exposes the matching NUT
variable. Status and the three binary sensors are always created for each UPS.
Low battery-voltage values are normalized for NUT drivers that report 12V-class
batteries as `1.2` or `1.3`; AC voltage entities are skipped when the raw NUT
value is clearly implausible for the reported UPS.

## Full ID Example

Assume:

```text
UGOS_BRIDGE_MQTT_TOPIC_PREFIX=ugos_bridge
UGOS_BRIDGE_MQTT_DISCOVERY_PREFIX=homeassistant
host name: dxp6800_pro
container name: Home Assistant
container project: apps
filesystem name: /volume1
```

The host CPU sensor is created with:

```text
device_id:       ugos_bridge_host_dxp6800_pro
unique_id:       ugos_bridge_host_dxp6800_pro_cpu_usage_percent
object_id:       ugos_bridge_host_dxp6800_pro_cpu_usage_percent
state_topic:     ugos_bridge/host/cpu_usage_percent/state
discovery_topic: homeassistant/sensor/ugos_bridge_host_dxp6800_pro/cpu_usage_percent/config
```

The Docker container running binary sensor is created with:

```text
device_id:       ugos_bridge_container_home_assistant
parent_device:   ugos_bridge_project_apps
unique_id:       ugos_bridge_container_home_assistant_running
object_id:       ugos_bridge_container_home_assistant_running
state_topic:     ugos_bridge/containers/home_assistant/running/state
discovery_topic: homeassistant/binary_sensor/ugos_bridge_container_home_assistant/running/config
```

The filesystem used-bytes sensor is created with:

```text
device_id:       ugos_bridge_host_dxp6800_pro_filesystem_volume1
unique_id:       ugos_bridge_host_dxp6800_pro_filesystem_volume1_used_bytes
object_id:       ugos_bridge_host_dxp6800_pro_filesystem_volume1_used_bytes
state_topic:     ugos_bridge/host/filesystems/volume1/used_bytes/state
discovery_topic: homeassistant/sensor/ugos_bridge_filesystem_volume1/used_bytes/config
```

If `/volume1` is associated with array `md0`, its filesystem device has:

```text
via_device: ugos_bridge_host_dxp6800_pro_array_md0
```
