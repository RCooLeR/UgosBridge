# ugos-bridge

![ugos-bridge overview](https://raw.githubusercontent.com/RCooLeR/UgosBridge/main/ugos-nas-bridge.png)

Lightweight metrics bridge for UGOS / UGREEN NAS hosts, Docker Compose stacks,
and QEMU/libvirt virtual machines. It collects Docker, VM, host, storage,
network, GPU, and hardware health telemetry and exports it to Prometheus and
MQTT/Home Assistant discovery.

Prometheus listens on `:9877` by default. MQTT/Home Assistant export is optional
and can be enabled with environment variables.

GitHub: https://github.com/RCooLeR/UgosBridge

## Docker Compose

```yaml
services:
  ugos-bridge:
    image: rcooler/ugos-bridge:latest
    container_name: ugos-bridge
    restart: unless-stopped
    ports:
      - "9877:9877"
    environment:
      UGOS_BRIDGE_LISTEN_ADDRESS: ":9877"
      UGOS_BRIDGE_DOCKER_HOST: "unix:///var/run/docker.sock"
      UGOS_BRIDGE_SCRAPE_INTERVAL: "15s"
      UGOS_BRIDGE_HOST_METRICS_ENABLED: "true"
      UGOS_BRIDGE_HOST_PROCFS: "/host/proc"
      UGOS_BRIDGE_HOST_SYSFS: "/host/sys"
      UGOS_BRIDGE_HOST_NAME: "ugreen-nas"
      # UGOS Pro 1.19+ Docker Projects UI rejects a direct /:/rootfs bind.
      UGOS_BRIDGE_HOST_FILESYSTEMS: "/volume1:/volume1,/volume2:/volume2"
      UGOS_BRIDGE_HOST_VMS_ENABLED: "true"
      UGOS_BRIDGE_HOST_VIRSH_URI: "qemu:///system"
      UGOS_BRIDGE_MQTT_ENABLED: "false"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /volume1:/volume1:ro
      - /volume2:/volume2:ro
      - /var/run/libvirt:/var/run/libvirt:ro
```

UGOS Pro 1.19 and later reports `invalid configuration file` when its Docker
Projects UI encounters `- /:/rootfs:ro`. Omit that bind when using the UI. It
only affects optional host `/` filesystem telemetry (byte, inode, and read-only
series); `/volume1`, `/volume2`, and all other configured bridge telemetry
remain available. The bind remains valid for deployments managed outside the
UGOS Docker Projects UI.

Enable MQTT/Home Assistant discovery by setting:

```yaml
      UGOS_BRIDGE_MQTT_ENABLED: "true"
      UGOS_BRIDGE_MQTT_BROKER: "tcp://homeassistant.local:1883"
      UGOS_BRIDGE_MQTT_USER: "ha"
      UGOS_BRIDGE_MQTT_PASS: "change_me"
      UGOS_BRIDGE_MQTT_TOPIC_PREFIX: "ugos_bridge"
      UGOS_BRIDGE_MQTT_DISCOVERY_PREFIX: "homeassistant"
      UGOS_BRIDGE_MQTT_RETAIN: "true"
      UGOS_BRIDGE_MQTT_EXPIRE_AFTER: "360"
```

UgosBridge is an unofficial compatibility project and is not affiliated with,
endorsed by, or sponsored by UGREEN.
