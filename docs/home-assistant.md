# Home Assistant Sensors And Devices

This guide describes what `ugos-bridge` creates in Home Assistant when MQTT
publishing is enabled: devices, sensors, binary sensors, topics, and generated
IDs.

Home Assistant support is implemented with MQTT discovery. The bridge publishes
JSON state messages and discovery config messages. Home Assistant creates
devices and entities from those discovery messages.

## Required Configuration

MQTT and discovery are controlled by these settings:

| Setting | Default | Purpose |
| --- | --- | --- |
| `UGOS_BRIDGE_MQTT_ENABLED` | `false` | Enables MQTT publishing and Home Assistant discovery. |
| `UGOS_BRIDGE_MQTT_BROKER` | none | MQTT broker URL, for example `tcp://homeassistant.local:1883`. |
| `UGOS_BRIDGE_MQTT_TOPIC_PREFIX` | `ugos_bridge` | Prefix for bridge state and availability topics. |
| `UGOS_BRIDGE_MQTT_DISCOVERY_PREFIX` | `homeassistant` | Home Assistant MQTT discovery prefix. |
| `UGOS_BRIDGE_MQTT_RETAIN` | `false` | Retain flag used for state and discovery publishes. |
| `UGOS_BRIDGE_MQTT_EXPIRE_AFTER` | unset | Adds `expire_after` to numeric sensor discovery payloads when greater than zero. |

Host, storage, network, GPU, UPS, cooling, health, process, and VM devices only appear
when host metrics are enabled and the related data is available. Docker project
and container devices appear in Docker-only mode.

## MQTT Topics

With the default topic prefix `ugos_bridge`, the bridge publishes availability to:

```text
ugos_bridge/status
```

The retained Last Will payload is `offline`. When connected, the bridge publishes
`online`. Discovery entities use this topic through:

```json
"availability_topic": "ugos_bridge/status",
"payload_available": "online",
"payload_not_available": "offline"
```

State topics use the configured MQTT topic prefix:

| Data | State topic pattern |
| --- | --- |
| Host summary | `<topic_prefix>/host/state` |
| Docker project | `<topic_prefix>/projects/<project_slug>/state` |
| Docker container | `<topic_prefix>/containers/<container_slug>/state` |
| Virtual machine | `<topic_prefix>/virtual_machines/<vm_id_slug>/state` |
| Process group | `<topic_prefix>/host/processes/<process_slug>/state` |
| Filesystem | `<topic_prefix>/host/filesystems/<filesystem_slug>/state` |
| Physical disk | `<topic_prefix>/host/disks/<disk_slug>/state` |
| Array / storage pool | `<topic_prefix>/host/arrays/<array_slug>/state` |
| Bond interface | `<topic_prefix>/host/bonds/<bond_slug>/state` |
| Bond slave interface | `<topic_prefix>/host/bonds/<bond_slug>/slaves/<slave_slug>/state` |
| Network interface | `<topic_prefix>/host/networks/<network_slug>/state` |
| GPU | `<topic_prefix>/host/gpus/<gpu_slug>/state` |
| Hardware health sensor | `<topic_prefix>/host/sensors/<sensor_slug>/state` |
| Cooling device | `<topic_prefix>/host/cooling/<cooling_slug>/state` |
| UPS | `<topic_prefix>/host/ups/<ups_slug>/state` |

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
"state_topic": "<state_topic>",
"json_attributes_topic": "<state_topic>",
"value_template": "{{ value_json.<value_key> }}"
```

Every binary sensor uses the same `unique_id`, `object_id`, `state_topic`, and
`json_attributes_topic` pattern, but uses its own `value_template`,
`payload_on`, and `payload_off`.

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
| Physical disk | `<host_device_id>_disk_<disk_slug>` | Host device |
| Bond interface | `<host_device_id>_bond_<bond_slug>` | Host device |
| Bond slave interface | `<host_device_id>_bond_<bond_slug>_slave_<slave_slug>` | Bond device |
| Network interface | `<host_device_id>_network_<network_slug>` | Bond device when `network.Master` is known, otherwise host device |
| GPU | `<host_device_id>_gpu_<gpu_slug>` | Host device |
| Hardware health chip | `<host_device_id>_health_<chip_slug>` | Host device |
| Disk health sensor | `<host_device_id>_disk_<disk_slug>` | Host device |
| Cooling device | `<host_device_id>_cooling_<cooling_slug>` | Host device |
| UPS | `<host_device_id>_ups_<ups_slug>` | Host device |

Disk temperature sensors are attached to the disk device when the collector can
map the sysfs sensor to a disk. Otherwise, temperature and fan sensors are grouped
under a hardware health chip device.

## Discovery Lifecycle

The bridge keeps an in-memory set of entities discovered during the current
process lifetime.

- On the first snapshot after startup, discovery config is published for every
  current entity.
- On later snapshots, only newly seen entities get new discovery config.
- If an entity disappears, the bridge publishes an empty payload to that entity's
  discovery config topic so Home Assistant can remove it.
- The bridge does not clear the old state topic when removing discovery. Only the
  discovery config is removed.

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
<topic_prefix>/host/state
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

The host state payload also carries extra JSON attributes such as CPU cores,
total/free/available/cached/buffer memory, swap bytes, and `collected_at`.
`Load 1m` is exposed as the bridge's one-minute load value and displayed as a
percent-style gauge by the bundled Lovelace cards.

### Docker Project Devices

Device ID:

```text
ugos_bridge_project_<project_slug>
```

State topic:

```text
<topic_prefix>/projects/<project_slug>/state
```

| Entity | Component | Object ID | Value key | Unit | Device class | State class |
| --- | --- | --- | --- | --- | --- | --- |
| CPU | `sensor` | `cpu_usage_percent` | `cpu_usage_percent` | `%` | | `measurement` |
| Memory | `sensor` | `memory_usage_bytes` | `memory_usage_bytes` | `B` | `data_size` | `measurement` |
| Total Containers | `sensor` | `total_containers` | `total_containers` | | | `measurement` |
| Running Containers | `sensor` | `running_containers` | `running_containers` | | | `measurement` |

Project state payloads include a `containers` JSON attribute containing child
container summaries.

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
<topic_prefix>/containers/<container_slug>/state
```

| Entity | Component | Object ID | Value key or template | Unit | Device class | State class |
| --- | --- | --- | --- | --- | --- | --- |
| CPU | `sensor` | `cpu_usage_percent` | `cpu_usage_percent` | `%` | | `measurement` |
| Memory | `sensor` | `memory_usage_bytes` | `memory_usage_bytes` | `B` | `data_size` | `measurement` |
| Running | `sensor` | `running` | `running` | | | `measurement` |
| Running | `binary_sensor` | `running` | `{{ value_json.running }}` with `1` / `0` | | | |

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
`running_containers` means running VMs. Its `containers` JSON attribute contains
VM summaries shaped like container cards expect.

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
<topic_prefix>/virtual_machines/<ugos_vm_id_slug>/state
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
| Running | `binary_sensor` | `running` | `{{ value_json.running }}` with `1` / `0` | | | |

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

Only the first 10 process groups in the host snapshot are published to Home
Assistant.

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
<topic_prefix>/host/processes/<process_slug>/state
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
<topic_prefix>/host/arrays/<array_slug>/state
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
<topic_prefix>/host/filesystems/<filesystem_slug>/state
```

| Entity | Component | Object ID | Value key or template | Unit | Device class | State class |
| --- | --- | --- | --- | --- | --- | --- |
| Used | `sensor` | `used_bytes` | `used_bytes` | `B` | `data_size` | `measurement` |
| Free | `sensor` | `free_bytes` | `free_bytes` | `B` | `data_size` | `measurement` |
| Used | `sensor` | `used_percent` | `used_percent` | `%` | | `measurement` |
| Read Only | `binary_sensor` | `read_only` | `{{ value_json.read_only }}` with `1` / `0` | | `problem` | |

The root filesystem `/` uses slug `root`.

### Physical Disk Devices

Device ID:

```text
<host_device_id>_disk_<disk_slug>
```

Parent:

```text
<host_device_id>
```

State topic:

```text
<topic_prefix>/host/disks/<disk_slug>/state
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
<topic_prefix>/host/bonds/<bond_slug>/state
```

| Entity | Component | Object ID | Value key or template | Unit | Device class | State class |
| --- | --- | --- | --- | --- | --- | --- |
| Link Speed | `sensor` | `speed_mbps` | `speed_mbps` | `Mbit/s` | | `measurement` |
| Mode | `sensor` | `mode` | `mode` | | | |
| Active Slave | `sensor` | `active_slave` | `active_slave` | | | |
| MII Status | `sensor` | `mii_status` | `mii_status` | | | |
| Slave Count | `sensor` | `slave_count` | `slave_count` | | | `measurement` |
| Carrier | `binary_sensor` | `carrier` | `{{ value_json.carrier }}` with `1` / `0` | | `connectivity` | |

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
<topic_prefix>/host/bonds/<bond_slug>/slaves/<slave_slug>/state
```

| Entity | Component | Object ID | Value key or template | Unit | Device class | State class |
| --- | --- | --- | --- | --- | --- | --- |
| Link Speed | `sensor` | `speed_mbps` | `speed_mbps` | `Mbit/s` | | `measurement` |
| MII Status | `sensor` | `mii_status` | `mii_status` | | | |
| Carrier | `binary_sensor` | `carrier` | `{{ value_json.carrier }}` with `1` / `0` | | `connectivity` | |
| Active | `binary_sensor` | `active` | `{{ value_json.active }}` with `1` / `0` | | | |

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
<topic_prefix>/host/networks/<network_slug>/state
```

| Entity | Component | Object ID | Value key or template | Unit | Device class | State class |
| --- | --- | --- | --- | --- | --- | --- |
| RX Throughput | `sensor` | `rx_bytes_per_second` | `rx_bytes_per_second` | `B/s` | `data_rate` | `measurement` |
| TX Throughput | `sensor` | `tx_bytes_per_second` | `tx_bytes_per_second` | `B/s` | `data_rate` | `measurement` |
| Link Speed | `sensor` | `speed_mbps` | `speed_mbps` | `Mbit/s` | | `measurement` |
| Carrier | `binary_sensor` | `carrier` | `{{ value_json.carrier }}` with `1` / `0` | | `connectivity` | |

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
<topic_prefix>/host/gpus/<gpu_slug>/state
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
<host_device_id>_disk_<disk_slug>
```

Disk health entity ID base:

```text
<host_device_id>_disk_<disk_slug>_sensor_<sensor_slug>
```

State topic:

```text
<topic_prefix>/host/sensors/<sensor_slug>/state
```

`sensor_slug` is built from:

```text
<source>_<chip>_<sensor_name>
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
<topic_prefix>/host/cooling/<cooling_slug>/state
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
<topic_prefix>/host/ups/<ups_slug>/state
```

| Entity | Component | Object ID | Value key or template | Unit | Device class | State class |
| --- | --- | --- | --- | --- | --- | --- |
| Status | `sensor` | `status` | `status` | | | |
| Online | `binary_sensor` | `online` | `{{ value_json.online }}` with `1` / `0` | | | |
| On Battery | `binary_sensor` | `on_battery` | `{{ value_json.on_battery }}` with `1` / `0` | | | |
| Low Battery | `binary_sensor` | `low_battery` | `{{ value_json.low_battery }}` with `1` / `0` | | `problem` | |
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
state_topic:     ugos_bridge/host/state
discovery_topic: homeassistant/sensor/ugos_bridge_host_dxp6800_pro/cpu_usage_percent/config
```

The Docker container running binary sensor is created with:

```text
device_id:       ugos_bridge_container_home_assistant
parent_device:   ugos_bridge_project_apps
unique_id:       ugos_bridge_container_home_assistant_running
object_id:       ugos_bridge_container_home_assistant_running
state_topic:     ugos_bridge/containers/home_assistant/state
discovery_topic: homeassistant/binary_sensor/ugos_bridge_container_home_assistant/running/config
```

The filesystem used-bytes sensor is created with:

```text
device_id:       ugos_bridge_host_dxp6800_pro_filesystem_volume1
unique_id:       ugos_bridge_host_dxp6800_pro_filesystem_volume1_used_bytes
object_id:       ugos_bridge_host_dxp6800_pro_filesystem_volume1_used_bytes
state_topic:     ugos_bridge/host/filesystems/volume1/state
discovery_topic: homeassistant/sensor/ugos_bridge_filesystem_volume1/used_bytes/config
```

If `/volume1` is associated with array `md0`, its filesystem device has:

```text
via_device: ugos_bridge_host_dxp6800_pro_array_md0
```
