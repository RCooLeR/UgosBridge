# Prometheus Metrics Guide

`ugos-bridge` exposes Prometheus metrics from the HTTP server.

Default listen address:

```text
:9877
```

Default metrics path:

```text
/metrics
```

Configure with:

```text
UGOS_BRIDGE_LISTEN_ADDRESS=:9877
UGOS_BRIDGE_METRICS_PATH=/metrics
```

## Scrape Config

```yaml
scrape_configs:
  - job_name: ugos-bridge
    scrape_interval: 30s
    static_configs:
      - targets: ["ugos-bridge:9877"]
```

The bridge updates its internal snapshot on `UGOS_BRIDGE_SCRAPE_INTERVAL`.
Prometheus may scrape faster or slower than that, but scraping faster than the
snapshot interval will usually repeat the same values.

## Bridge Health

| Metric | Meaning |
| --- | --- |
| `ugos_bridge_up` | `1` when the last collection succeeded, otherwise `0`. |
| `ugos_bridge_last_collection_timestamp_seconds` | Unix timestamp of the last collection attempt. |
| `ugos_bridge_container_stats_errors` | Number of container stats fetches that failed in the last collection. |

Example alerts:

```promql
ugos_bridge_up == 0
time() - ugos_bridge_last_collection_timestamp_seconds > 120
ugos_bridge_container_stats_errors > 0
```

## Docker Metrics

Basic container metrics are always exported when Docker collection succeeds.

| Metric | Labels | Meaning |
| --- | --- | --- |
| `ugos_bridge_container_cpu_usage_percent` | `container_id`, `container`, `project`, `image`, `state` | Per-container CPU usage percent. |
| `ugos_bridge_container_memory_usage_bytes` | same | Effective working-set style memory usage. |
| `ugos_bridge_container_memory_limit_bytes` | same | Configured memory limit. |
| `ugos_bridge_container_running` | same | `1` when running, otherwise `0`. |
| `ugos_bridge_container_stats_collected` | same | `1` when detailed stats were collected for that container. |

Project aggregate metrics:

| Metric | Labels | Meaning |
| --- | --- | --- |
| `ugos_bridge_project_cpu_usage_percent` | `project`, `running`, `total` | Sum of container CPU percent by project. |
| `ugos_bridge_project_memory_usage_bytes` | same | Sum of container memory usage by project. |
| `ugos_bridge_project_total_containers` | same | Total containers in the project. |
| `ugos_bridge_project_running_containers` | same | Running containers in the project. |

Useful queries:

```promql
topk(10, ugos_bridge_container_cpu_usage_percent)
topk(10, ugos_bridge_container_memory_usage_bytes)
sum by (project) (ugos_bridge_container_cpu_usage_percent)
sum by (project) (ugos_bridge_container_memory_usage_bytes)
```

## Detailed Container Metrics

Enable detailed stats with:

```text
UGOS_BRIDGE_DETAILED_CONTAINER_STATS=true
```

Additional metrics:

| Metric | Extra labels | Meaning |
| --- | --- | --- |
| `ugos_bridge_container_cpu_usage_seconds_total` | none | Total CPU time. |
| `ugos_bridge_container_cpu_user_seconds_total` | none | User-mode CPU time. |
| `ugos_bridge_container_cpu_system_seconds_total` | none | Kernel-mode CPU time. |
| `ugos_bridge_container_cpu_cfs_periods_total` | none | CFS periods. |
| `ugos_bridge_container_cpu_cfs_throttled_periods_total` | none | Throttled CFS periods. |
| `ugos_bridge_container_cpu_cfs_throttled_seconds_total` | none | Total throttled CFS time. |
| `ugos_bridge_container_spec_cpu_quota` | none | CFS quota in microseconds. |
| `ugos_bridge_container_spec_cpu_period` | none | CFS period in microseconds. |
| `ugos_bridge_container_spec_cpu_shares` | none | Configured CPU shares. |
| `ugos_bridge_container_memory_usage_raw_bytes` | none | Raw Docker memory usage. |
| `ugos_bridge_container_memory_working_set_bytes` | none | Working-set memory. |
| `ugos_bridge_container_memory_max_usage_bytes` | none | Peak memory usage. |
| `ugos_bridge_container_memory_rss_bytes` | none | RSS memory. |
| `ugos_bridge_container_memory_cache_bytes` | none | Page cache memory. |
| `ugos_bridge_container_memory_swap_bytes` | none | Swap memory. |
| `ugos_bridge_container_memory_fail_count` | none | Memory allocation failures. |
| `ugos_bridge_container_spec_memory_limit_bytes` | none | Memory limit. |
| `ugos_bridge_container_spec_memory_swap_limit_bytes` | none | Swap-inclusive memory limit. |
| `ugos_bridge_container_oom_killed` | none | OOM killed state. |
| `ugos_bridge_container_oom_events_total` | none | OOM events observed since bridge start. |
| `ugos_bridge_container_start_time_seconds` | none | Container start time. |
| `ugos_bridge_container_health_status` | `health` | Info-style health status gauge. |
| `ugos_bridge_container_pids_current` | none | Current PID count. |
| `ugos_bridge_container_network_bytes_total` | `interface`, `direction` | Container network byte counters. |
| `ugos_bridge_container_network_packets_total` | `interface`, `direction` | Container packet counters. |
| `ugos_bridge_container_network_errors_total` | `interface`, `direction` | Container network errors. |
| `ugos_bridge_container_network_dropped_total` | `interface`, `direction` | Container dropped packets. |
| `ugos_bridge_container_blkio_bytes_total` | `operation` | Block I/O byte counters. |
| `ugos_bridge_container_blkio_operations_total` | `operation` | Block I/O operation counters. |
| `ugos_bridge_container_blkio_time_seconds_total` | `type` | Block I/O time counters. |
| `ugos_bridge_container_filesystem_size_bytes` | `type` | Container filesystem sizes. |

All detailed container metrics also include the standard container labels:

```text
container_id, container, project, image, state
```

## Host CPU And Memory

| Metric | Labels | Meaning |
| --- | --- | --- |
| `ugos_bridge_host_info` | `host` | Static host metadata. |
| `ugos_bridge_host_cpu_usage_percent` | `host` | Overall host CPU usage. |
| `ugos_bridge_host_cpu_core_usage_percent` | `host`, `cpu` | Per-core CPU usage. |
| `ugos_bridge_host_cpu_frequency_mhz` | `host`, `cpu`, `type` | CPU frequency by type. |
| `ugos_bridge_host_cpu_governor_info` | `host`, `cpu`, `governor` | CPU governor info-style gauge. |
| `ugos_bridge_host_load_average` | `host`, `window` | Load average by window. |
| `ugos_bridge_host_uptime_seconds` | `host` | Host uptime. |
| `ugos_bridge_host_context_switches` | `host` | Context switch count. |
| `ugos_bridge_host_processes_running` | `host` | Running process count from procfs. |
| `ugos_bridge_host_processes_blocked` | `host` | Blocked process count from procfs. |
| `ugos_bridge_host_memory_bytes` | `host`, `type` | Memory and swap bytes by type. |

Useful queries:

```promql
ugos_bridge_host_cpu_usage_percent
ugos_bridge_host_load_average{window="1m"}
ugos_bridge_host_memory_bytes{type="used"} / ugos_bridge_host_memory_bytes{type="total"} * 100
```

## Filesystems, Disks, And Arrays

Filesystem metrics:

| Metric | Labels |
| --- | --- |
| `ugos_bridge_host_filesystem_bytes` | `host`, `filesystem`, `mountpoint`, `source`, `fstype`, `array`, `type` |
| `ugos_bridge_host_filesystem_inodes` | same |
| `ugos_bridge_host_filesystem_readonly` | `host`, `filesystem`, `mountpoint`, `source`, `fstype`, `array` |

Disk metrics:

| Metric | Labels |
| --- | --- |
| `ugos_bridge_host_disk_info` | `host`, `disk`, `type`, `vendor`, `model`, `serial` |
| `ugos_bridge_host_disk_size_bytes` | `host`, `disk`, `type` |
| `ugos_bridge_host_disk_read_bytes_per_second` | `host`, `disk`, `type` |
| `ugos_bridge_host_disk_write_bytes_per_second` | `host`, `disk`, `type` |
| `ugos_bridge_host_disk_read_iops` | `host`, `disk`, `type` |
| `ugos_bridge_host_disk_write_iops` | `host`, `disk`, `type` |
| `ugos_bridge_host_disk_busy_percent` | `host`, `disk`, `type` |

Array metrics:

| Metric | Labels |
| --- | --- |
| `ugos_bridge_host_array_size_bytes` | `host`, `array`, `level`, `state` |
| `ugos_bridge_host_array_disks` | `host`, `array`, `level`, `state`, `type` |
| `ugos_bridge_host_array_sync_percent` | `host`, `array`, `level`, `state`, `action` |

Useful queries:

```promql
sum by (mountpoint) (ugos_bridge_host_filesystem_bytes{type="used"})
ugos_bridge_host_filesystem_readonly == 1
topk(10, ugos_bridge_host_disk_busy_percent)
ugos_bridge_host_array_disks{type="degraded"} > 0
```

## Network And Bonds

Network metrics:

| Metric | Labels |
| --- | --- |
| `ugos_bridge_host_network_info` | `host`, `interface`, `mac`, `state`, `duplex` |
| `ugos_bridge_host_network_speed_mbps` | `host`, `interface` |
| `ugos_bridge_host_network_carrier` | `host`, `interface` |
| `ugos_bridge_host_network_bytes` | `host`, `interface`, `direction` |
| `ugos_bridge_host_network_bytes_per_second` | `host`, `interface`, `direction` |
| `ugos_bridge_host_network_packets` | `host`, `interface`, `direction` |
| `ugos_bridge_host_network_errors` | `host`, `interface`, `direction` |
| `ugos_bridge_host_network_dropped` | `host`, `interface`, `direction` |

Bond metrics:

| Metric | Labels |
| --- | --- |
| `ugos_bridge_host_bond_info` | `host`, `bond`, `mode`, `active_slave`, `primary`, `mii_status`, `state` |
| `ugos_bridge_host_bond_speed_mbps` | `host`, `bond` |
| `ugos_bridge_host_bond_carrier` | `host`, `bond` |
| `ugos_bridge_host_bond_slaves` | `host`, `bond`, `type` |
| `ugos_bridge_host_bond_slave_info` | `host`, `bond`, `slave`, `mii_status`, `state`, `duplex`, `active` |
| `ugos_bridge_host_bond_slave_speed_mbps` | `host`, `bond`, `slave` |
| `ugos_bridge_host_bond_slave_carrier` | `host`, `bond`, `slave` |

Useful queries:

```promql
sum by (interface, direction) (ugos_bridge_host_network_bytes_per_second)
ugos_bridge_host_network_carrier == 0
ugos_bridge_host_bond_carrier == 0
ugos_bridge_host_bond_slaves{type="active"}
```

## GPU, Health, And Cooling

GPU metrics:

| Metric | Labels |
| --- | --- |
| `ugos_bridge_host_gpu_info` | `host`, `gpu`, `driver`, `vendor`, `device` |
| `ugos_bridge_host_gpu_busy_percent` | `host`, `gpu`, `driver` |
| `ugos_bridge_host_gpu_frequency_mhz` | `host`, `gpu`, `driver`, `type` |
| `ugos_bridge_host_gpu_engine_percent` | `host`, `gpu`, `driver`, `engine`, `type` |
| `ugos_bridge_host_gpu_stat` | `host`, `gpu`, `driver`, `type` |

Health and cooling metrics:

| Metric | Labels |
| --- | --- |
| `ugos_bridge_host_temperature_celsius` | `host`, `sensor`, `chip`, `label`, `source`, `device_type`, `device` |
| `ugos_bridge_host_fan_speed_rpm` | same |
| `ugos_bridge_host_cooling_device_state` | `host`, `device`, `type`, `state` |
| `ugos_bridge_host_cooling_device_percent` | `host`, `device`, `type` |

Temperature values are smoothed by the bridge over
`UGOS_BRIDGE_HOST_TEMPERATURE_AVERAGE_WINDOW` (`2m` by default). Set the window
to `0s` if your alerting rules should use raw sensor samples.

UPS metrics are exported when `UGOS_BRIDGE_HOST_UPS_ENABLED=true` and `upsc`
returns data:

| Metric | Labels |
| --- | --- |
| `ugos_bridge_host_ups_info` | `host`, `ups`, `manufacturer`, `model`, `serial` |
| `ugos_bridge_host_ups_status_info` | `host`, `ups`, `status` |
| `ugos_bridge_host_ups_online` | `host`, `ups` |
| `ugos_bridge_host_ups_on_battery` | `host`, `ups` |
| `ugos_bridge_host_ups_low_battery` | `host`, `ups` |
| `ugos_bridge_host_ups_battery_charge_percent` | `host`, `ups` |
| `ugos_bridge_host_ups_battery_runtime_seconds` | `host`, `ups` |
| `ugos_bridge_host_ups_voltage` | `host`, `ups`, `type` |
| `ugos_bridge_host_ups_load_percent` | `host`, `ups` |
| `ugos_bridge_host_ups_power_watts` | `host`, `ups`, `type` |
| `ugos_bridge_host_ups_line_frequency_hz` | `host`, `ups` |
| `ugos_bridge_host_ups_temperature_celsius` | `host`, `ups` |

UPS voltage metrics are emitted only when the NUT value passes basic sanity
checks. Low battery-voltage values are normalized for NUT drivers that report
12V-class batteries as `1.2` or `1.3`; implausible AC output values such as `20`
are skipped.

Useful queries:

```promql
max by (host) (ugos_bridge_host_temperature_celsius)
max by (gpu) (ugos_bridge_host_gpu_busy_percent)
ugos_bridge_host_fan_speed_rpm
ugos_bridge_host_ups_on_battery == 1
ugos_bridge_host_ups_low_battery == 1
```

## Process Groups

The bridge exports the top host software groups by CPU usage.

| Metric | Labels | Meaning |
| --- | --- | --- |
| `ugos_bridge_host_process_group_count` | `host`, `software` | Number of OS processes in the group. |
| `ugos_bridge_host_process_group_cpu_usage_percent` | same | Group CPU usage percent. |
| `ugos_bridge_host_process_group_memory_bytes` | same | Group resident memory. |
| `ugos_bridge_host_process_group_cpu_time_seconds` | same | Accumulated group CPU time. |

Useful queries:

```promql
topk(10, ugos_bridge_host_process_group_cpu_usage_percent)
topk(10, ugos_bridge_host_process_group_memory_bytes)
```

## Virtual Machines

VM metrics are exported when host metrics are enabled and `virsh` can reach
libvirt.

| Metric | Labels |
| --- | --- |
| `ugos_bridge_host_vm_info` | `host`, `ugos_vm_id`, `vm`, `source_name`, `state`, `iso_path` |
| `ugos_bridge_host_vm_running` | `host`, `ugos_vm_id`, `vm` |
| `ugos_bridge_host_vm_vcpus` | same |
| `ugos_bridge_host_vm_cpu_usage_percent` | same |
| `ugos_bridge_host_vm_cpu_time_seconds` | same |
| `ugos_bridge_host_vm_memory_bytes` | `host`, `ugos_vm_id`, `vm`, `type` |
| `ugos_bridge_host_vm_block_bytes_total` | `host`, `ugos_vm_id`, `vm`, `direction` |
| `ugos_bridge_host_vm_network_bytes_total` | `host`, `ugos_vm_id`, `vm`, `direction` |

`ugos_bridge_host_vm_memory_bytes{type="used"}` is actual guest RAM usage when
libvirt balloon `available` and `unused` stats are available. The `current` type
is current assigned/balloon memory, and `maximum` is the configured maximum.
Stopped VMs export `type="used"` as `0`.

Useful queries:

```promql
ugos_bridge_host_vm_running == 0
topk(10, ugos_bridge_host_vm_cpu_usage_percent)
sum by (vm) (ugos_bridge_host_vm_memory_bytes{type="used"})
```

## Notes

- Most `*_total` metrics are represented as gauges because the bridge reports
  snapshot values from Docker, procfs, sysfs, or libvirt.
- Host metrics appear only when `UGOS_BRIDGE_HOST_METRICS_ENABLED=true`.
- Detailed container metrics appear only when detailed container stats are
  enabled.
- GPU busy and `intel_gpu_top` metrics depend on kernel, driver, permissions,
  and available host binaries.
