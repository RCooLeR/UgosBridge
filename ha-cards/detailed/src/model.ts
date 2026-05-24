import { THEME_COLORS } from './theme';
import type {
  DockerProject,
  DockerTotals,
  DriveInfo,
  HardwareMetricCard,
  HardwareSummaryCard,
  NasDashboardModel,
  ProcessDetail,
  StoragePool,
  TrafficPoint
} from './types';

const gib = (value: number): number => value * 1024 ** 3;
const tib = (value: number): number => value * 1024 ** 4;
const mbit = (value: number): number => value * 1_000_000;
const gbit = (value: number): number => value * 1_000_000_000;

const series = (base: number, deltas: number[]): number[] =>
  deltas.map((delta) => Math.max(0, Number((base + delta).toFixed(3))));

const dockerProjects: DockerProject[] = [
  {
    key: 'gitea',
    title: 'Gitea',
    cpuPercent: 0.3925496609109711,
    memoryBytes: 324 * 1024 ** 2,
    runningContainers: 2,
    totalContainers: 2,
    status: 'up',
    containers: [
      {
        key: 'gitea',
        name: 'gitea',
        image: 'gitea/gitea:latest',
        status: 'Up 5 days',
        state: 'running',
        running: true,
        cpuPercent: 0.21,
        memoryBytes: 218 * 1024 ** 2,
        memoryLimitBytes: gib(2)
      },
      {
        key: 'cloudflared_gitea',
        name: 'cloudflared_gitea',
        image: 'cloudflare/cloudflared:latest',
        status: 'Up 5 days',
        state: 'running',
        running: true,
        cpuPercent: 0.18,
        memoryBytes: 106 * 1024 ** 2,
        memoryLimitBytes: gib(1)
      }
    ]
  },
  {
    key: 'go_back_db',
    title: 'Go Back DB',
    cpuPercent: 0,
    memoryBytes: 768 * 1024 ** 2,
    runningContainers: 3,
    totalContainers: 3,
    status: 'up',
    containers: [
      {
        key: 'go_back_db_app',
        name: 'go_back_db_app',
        image: 'ghcr.io/example/go-back-db-app:latest',
        status: 'Up 9 days',
        state: 'running',
        running: true,
        cpuPercent: 0,
        memoryBytes: 256 * 1024 ** 2,
        memoryLimitBytes: gib(2)
      },
      {
        key: 'go_back_db_front',
        name: 'go_back_db_front',
        image: 'ghcr.io/example/go-back-db-front:latest',
        status: 'Up 9 days',
        state: 'running',
        running: true,
        cpuPercent: 0,
        memoryBytes: 188 * 1024 ** 2,
        memoryLimitBytes: gib(1)
      },
      {
        key: 'go_back_db_postgres',
        name: 'go_back_db_postgres',
        image: 'postgres:16',
        status: 'Up 9 days',
        state: 'running',
        running: true,
        cpuPercent: 0,
        memoryBytes: 324 * 1024 ** 2,
        memoryLimitBytes: gib(2)
      }
    ]
  },
  {
    key: 'gorent',
    title: 'GoRent',
    cpuPercent: 0,
    memoryBytes: 412 * 1024 ** 2,
    runningContainers: 3,
    totalContainers: 3,
    status: 'up',
    containers: [
      {
        key: 'gorent-backend',
        name: 'gorent-backend',
        image: 'ghcr.io/example/gorent-backend:latest',
        status: 'Up 3 days',
        state: 'running',
        running: true,
        cpuPercent: 0,
        memoryBytes: 178 * 1024 ** 2,
        memoryLimitBytes: gib(2)
      },
      {
        key: 'gorent-frontend',
        name: 'gorent-frontend',
        image: 'ghcr.io/example/gorent-frontend:latest',
        status: 'Up 3 days',
        state: 'running',
        running: true,
        cpuPercent: 0,
        memoryBytes: 94 * 1024 ** 2,
        memoryLimitBytes: gib(1)
      },
      {
        key: 'gorent-postgres',
        name: 'gorent-postgres',
        image: 'postgres:16',
        status: 'Up 3 days',
        state: 'running',
        running: true,
        cpuPercent: 0,
        memoryBytes: 140 * 1024 ** 2,
        memoryLimitBytes: gib(2)
      }
    ]
  },
  {
    key: 'home-assistant',
    title: 'Home Assistant',
    cpuPercent: 0.10272887844115354,
    memoryBytes: 612 * 1024 ** 2,
    runningContainers: 4,
    totalContainers: 4,
    status: 'up',
    containers: [
      {
        key: 'homeassistant',
        name: 'homeassistant',
        image: 'ghcr.io/home-assistant/home-assistant:stable',
        status: 'Up 14 days',
        state: 'running',
        running: true,
        cpuPercent: 0.08,
        memoryBytes: 356 * 1024 ** 2,
        memoryLimitBytes: gib(3)
      },
      {
        key: 'go2rtc',
        name: 'go2rtc',
        image: 'alexxit/go2rtc:latest',
        status: 'Up 14 days',
        state: 'running',
        running: true,
        cpuPercent: 0.01,
        memoryBytes: 88 * 1024 ** 2,
        memoryLimitBytes: gib(1)
      },
      {
        key: 'mosquitto',
        name: 'mosquitto',
        image: 'eclipse-mosquitto:2',
        status: 'Up 14 days',
        state: 'running',
        running: true,
        cpuPercent: 0.01,
        memoryBytes: 52 * 1024 ** 2,
        memoryLimitBytes: gib(1)
      },
      {
        key: 'ugos-bridge',
        name: 'ugos-bridge',
        image: 'rcooler/ugos-bridge:latest',
        status: 'Up 14 days',
        state: 'running',
        running: true,
        cpuPercent: 0.01,
        memoryBytes: 116 * 1024 ** 2,
        memoryLimitBytes: gib(1)
      }
    ]
  },
  {
    key: 'virtual_machines',
    title: 'Virtual machines',
    cpuPercent: 3.4,
    memoryBytes: gib(5.8),
    runningContainers: 2,
    totalContainers: 3,
    status: 'partial',
    containers: [
      {
        key: 'ugos-vm-win11',
        name: 'Windows 11',
        image: 'Win11_24H2_English_x64',
        status: 'Running',
        state: 'running',
        running: true,
        cpuPercent: 2.7,
        memoryBytes: gib(4.1),
        memoryLimitBytes: gib(8)
      },
      {
        key: 'ugos-vm-ubuntu',
        name: 'Ubuntu Server',
        image: 'ubuntu-24.04.2-live-server-amd64',
        status: 'Running',
        state: 'running',
        running: true,
        cpuPercent: 0.7,
        memoryBytes: gib(1.7),
        memoryLimitBytes: gib(4)
      },
      {
        key: 'ugos-vm-test',
        name: 'Test Lab',
        image: 'debian-12.10.0-amd64-netinst',
        status: 'Shutoff',
        state: 'shutoff',
        running: false,
        cpuPercent: 0,
        memoryBytes: 0,
        memoryLimitBytes: gib(2)
      }
    ]
  },
  {
    key: 'jellyfin',
    title: 'Jellyfin',
    cpuPercent: 0.009448818897637795,
    memoryBytes: 256 * 1024 ** 2,
    runningContainers: 1,
    totalContainers: 1,
    status: 'up',
    containers: [
      {
        key: 'jellyfin-app-1',
        name: 'jellyfin-app-1',
        image: 'jellyfin/jellyfin:latest',
        status: 'Up 11 days',
        state: 'running',
        running: true,
        cpuPercent: 0.01,
        memoryBytes: 256 * 1024 ** 2,
        memoryLimitBytes: gib(4)
      }
    ]
  },
  {
    key: 'kuma_monitoring',
    title: 'Kuma Monitoring',
    cpuPercent: 2.976829051619071,
    memoryBytes: 430 * 1024 ** 2,
    runningContainers: 3,
    totalContainers: 3,
    status: 'up',
    containers: [
      {
        key: 'uptime-kuma',
        name: 'uptime-kuma',
        image: 'louislam/uptime-kuma:latest',
        status: 'Up 8 days',
        state: 'running',
        running: true,
        cpuPercent: 2.64,
        memoryBytes: 284 * 1024 ** 2,
        memoryLimitBytes: gib(2)
      },
      {
        key: 'cloudflared_kuma',
        name: 'cloudflared_kuma',
        image: 'cloudflare/cloudflared:latest',
        status: 'Up 8 days',
        state: 'running',
        running: true,
        cpuPercent: 0.14,
        memoryBytes: 76 * 1024 ** 2,
        memoryLimitBytes: gib(1)
      },
      {
        key: 'kuma_vpn',
        name: 'kuma_vpn',
        image: 'qmcgaw/gluetun:latest',
        status: 'Up 8 days',
        state: 'running',
        running: true,
        cpuPercent: 0.19,
        memoryBytes: 70 * 1024 ** 2,
        memoryLimitBytes: gib(1)
      }
    ]
  },
  {
    key: 'monitoring',
    title: 'Monitoring',
    cpuPercent: 1.8076912575738409,
    memoryBytes: gib(1.2),
    runningContainers: 9,
    totalContainers: 9,
    status: 'up',
    containers: [
      {
        key: 'grafana',
        name: 'grafana',
        image: 'grafana/grafana:latest',
        status: 'Up 6 days',
        state: 'running',
        running: true,
        cpuPercent: 0.52,
        memoryBytes: 298 * 1024 ** 2,
        memoryLimitBytes: gib(2)
      },
      {
        key: 'prometheus',
        name: 'prometheus',
        image: 'prom/prometheus:latest',
        status: 'Up 6 days',
        state: 'running',
        running: true,
        cpuPercent: 0.41,
        memoryBytes: 356 * 1024 ** 2,
        memoryLimitBytes: gib(2)
      },
      {
        key: 'loki',
        name: 'loki',
        image: 'grafana/loki:latest',
        status: 'Up 6 days',
        state: 'running',
        running: true,
        cpuPercent: 0.18,
        memoryBytes: 184 * 1024 ** 2,
        memoryLimitBytes: gib(2)
      }
    ]
  },
  {
    key: 'nas',
    title: 'NAS',
    cpuPercent: 0.8259763328145205,
    memoryBytes: 508 * 1024 ** 2,
    runningContainers: 3,
    totalContainers: 3,
    status: 'up',
    containers: [
      {
        key: 'nas-node-prom-bridge',
        name: 'nas-node-prom-bridge',
        image: 'ghcr.io/example/nas-node-prom-bridge:latest',
        status: 'Up 20 days',
        state: 'running',
        running: true,
        cpuPercent: 0.31,
        memoryBytes: 188 * 1024 ** 2,
        memoryLimitBytes: gib(1)
      },
      {
        key: 'cloudflared_nas',
        name: 'cloudflared_nas',
        image: 'cloudflare/cloudflared:latest',
        status: 'Up 20 days',
        state: 'running',
        running: true,
        cpuPercent: 0.21,
        memoryBytes: 94 * 1024 ** 2,
        memoryLimitBytes: gib(1)
      },
      {
        key: 'jinko_exporter',
        name: 'jinko_exporter',
        image: 'ghcr.io/example/jinko-exporter:latest',
        status: 'Up 20 days',
        state: 'running',
        running: true,
        cpuPercent: 0.31,
        memoryBytes: 226 * 1024 ** 2,
        memoryLimitBytes: gib(1)
      }
    ]
  },
  {
    key: 'torrent',
    title: 'Torrent',
    cpuPercent: 0.07306297825467073,
    memoryBytes: 184 * 1024 ** 2,
    runningContainers: 2,
    totalContainers: 2,
    status: 'up',
    containers: [
      {
        key: 'qbittorrent',
        name: 'qbittorrent',
        image: 'lscr.io/linuxserver/qbittorrent:latest',
        status: 'Up 12 days',
        state: 'running',
        running: true,
        cpuPercent: 0.05,
        memoryBytes: 128 * 1024 ** 2,
        memoryLimitBytes: gib(2)
      },
      {
        key: 'qbittorrent_gluetun',
        name: 'qbittorrent_gluetun',
        image: 'qmcgaw/gluetun:latest',
        status: 'Up 12 days',
        state: 'running',
        running: true,
        cpuPercent: 0.02,
        memoryBytes: 56 * 1024 ** 2,
        memoryLimitBytes: gib(1)
      }
    ]
  },
  {
    key: 'webserver',
    title: 'Webserver',
    cpuPercent: 1.123501622902011,
    memoryBytes: 736 * 1024 ** 2,
    runningContainers: 7,
    totalContainers: 7,
    status: 'up',
    containers: [
      {
        key: 'nginx',
        name: 'nginx',
        image: 'nginx:stable',
        status: 'Up 17 days',
        state: 'running',
        running: true,
        cpuPercent: 0.31,
        memoryBytes: 146 * 1024 ** 2,
        memoryLimitBytes: gib(1)
      },
      {
        key: 'nginx-proxy-manager',
        name: 'nginx-proxy-manager',
        image: 'jc21/nginx-proxy-manager:latest',
        status: 'Up 17 days',
        state: 'running',
        running: true,
        cpuPercent: 0.49,
        memoryBytes: 308 * 1024 ** 2,
        memoryLimitBytes: gib(2)
      },
      {
        key: 'php84',
        name: 'php84',
        image: 'php:8.4-fpm',
        status: 'Up 17 days',
        state: 'running',
        running: true,
        cpuPercent: 0.32,
        memoryBytes: 282 * 1024 ** 2,
        memoryLimitBytes: gib(2)
      }
    ]
  }
];

const dockerTotals = (projects: DockerProject[]): DockerTotals => ({
  totalContainers: projects.reduce((total, project) => total + project.totalContainers, 0),
  runningContainers: projects.reduce((total, project) => total + project.runningContainers, 0),
  totalProjects: projects.length,
  onlineProjects: projects.filter((project) => project.status === 'up').length
});

const storagePools: StoragePool[] = [
  {
    name: 'Pool 1',
    layout: 'RAID 6 | 6 Drives',
    status: 'healthy',
    usedBytes: tib(10.2),
    totalBytes: tib(40.5),
    accent: THEME_COLORS.green,
    key: 'pool_1',
    driveSlugs: ['sda', 'sdb', 'sdc', 'sdd', 'sde', 'sdf']
  },
  {
    name: 'Pool 2',
    layout: 'RAID 1 | 2 Drives (M.2)',
    status: 'healthy',
    usedBytes: tib(6.1),
    totalBytes: tib(8.2),
    accent: THEME_COLORS.purple,
    key: 'pool_2',
    driveSlugs: ['nvme0n1', 'nvme1n1']
  }
];

const totalStorageBytes = storagePools.reduce((total, pool) => total + pool.totalBytes, 0);
const usedStorageBytes = storagePools.reduce((total, pool) => total + pool.usedBytes, 0);

const hardwareSummary: HardwareSummaryCard[] = [
  { kind: 'cpu', title: 'CPU', accent: THEME_COLORS.blue, valuePercent: 18, temperatureCelsius: 45, series: series(18, [-2.2, -1.8, 0.3, -0.4, 1.7, -0.9, 2.8, -2.1, 1.2, 0.4]) },
  { kind: 'ram', title: 'RAM', accent: THEME_COLORS.purple, valuePercent: 46, usedBytes: gib(14.6), totalBytes: gib(32), series: series(46, [-2.1, -0.5, 1.1, -1.4, -2.2, 1.8, 1.4, 0.2, -1.1, 1.0]) },
  { kind: 'gpu', title: 'GPU', accent: THEME_COLORS.green, valuePercent: 32, temperatureCelsius: 48, series: series(32, [-1.5, -1.1, 0.2, 2.0, 1.3, 0.4, -0.8, 1.1, 0.2, -1.9]) },
  {
    kind: 'system-load',
    title: 'System Load',
    accent: THEME_COLORS.softBlue,
    value: 0.78,
    valuePercent: 0.78,
    valueText: '0.78%',
    unit: 'percent',
    statusText: 'Good',
    series: series(0.78, [-0.12, -0.08, 0.04, -0.03, 0.06, 0.09, -0.04, 0.05, -0.02, 0.07])
  },
  { kind: 'total-storage', title: 'Total Storage', accent: THEME_COLORS.cyan, totalBytes: totalStorageBytes, usedBytes: usedStorageBytes },
  { kind: 'network', title: 'Network', accent: THEME_COLORS.green, downloadBps: gbit(1.2), uploadBps: mbit(123) }
];

const hardwareDetails: HardwareMetricCard[] = [
  {
    key: 'cpu',
    title: 'CPU',
    subtitle: 'Intel Core i5-1235U',
    accent: THEME_COLORS.blue,
    utilizationPercent: 18,
    detailRows: [
      { label: 'Cores / Threads', value: '10 / 12' },
      { label: 'Base / Boost', value: '1.3 / 4.4 GHz' },
      { label: 'Temperature', value: '45°C' },
      { label: 'Power Usage', value: '18 W' }
    ],
    series: series(18, [-2.5, -1.8, 0.1, -0.6, 1.9, 0.4, 2.8, -1.9, 1.2, 3.3, -0.8, -1.6, 0.7, -0.9, 0, 1.9, -2.4, 0.9, 0.1, 1.8, -0.7])
  },
  {
    key: 'ram',
    title: 'RAM',
    subtitle: '32 GB DDR5',
    accent: THEME_COLORS.purple,
    utilizationPercent: 46,
    detailRows: [
      { label: 'Used', value: '14.6 GB' },
      { label: 'Total', value: '32 GB' },
      { label: 'Type', value: 'DDR5' },
      { label: 'Speed', value: '4800 MT/s' }
    ],
    series: series(46, [-2.1, -1.1, 0.9, 0.1, -1.1, -2.1, -1.2, 2.1, 0.3, 1.2, 2.9, 1.1, 2.1, -1.0, 0.2, 1.0, 2.0, -1.9, -1.1, 0.2, 1.0])
  },
  {
    key: 'gpu',
    title: 'GPU',
    subtitle: 'Intel Iris Xe',
    accent: THEME_COLORS.green,
    utilizationPercent: 32,
    detailRows: [
      { label: 'VRAM Used', value: '1.6 GB' },
      { label: 'VRAM Total', value: '8.0 GB' },
      { label: 'Temperature', value: '48°C' },
      { label: 'Power Usage', value: '15 W' }
    ],
    series: series(32, [-3.8, -2.0, -1.0, 1.1, -1.0, -2.0, 2.1, 3.8, 1.0, 0.2, 2.0, -1.0, -3.0, -2.0, 1.2, 3.1, 2.0, 0.1, -1.0, 1.0, -2.0])
  }
];

const drives: DriveInfo[] = [
  { name: 'M.2 1', model: 'Lexar NM790 1TB SSD', capacityBytes: gib(931), temperatureCelsius: 40, status: 'healthy', diskSlug: 'nvme0n1' },
  { name: 'M.2 2', model: 'Lexar NM790 1TB SSD', capacityBytes: gib(931), temperatureCelsius: 41, status: 'healthy', diskSlug: 'nvme1n1' },
  { name: 'HDD 1', model: 'Seagate IronWolf 12TB', capacityBytes: tib(10.9), temperatureCelsius: 36, status: 'healthy', diskSlug: 'sda' },
  { name: 'HDD 2', model: 'Seagate IronWolf 12TB', capacityBytes: tib(10.9), temperatureCelsius: 37, status: 'healthy', diskSlug: 'sdb' },
  { name: 'HDD 3', model: 'Seagate IronWolf 12TB', capacityBytes: tib(10.9), temperatureCelsius: 36, status: 'healthy', diskSlug: 'sdc' },
  { name: 'HDD 4', model: 'Seagate IronWolf 12TB', capacityBytes: tib(10.9), temperatureCelsius: 37, status: 'healthy', diskSlug: 'sdd' },
  { name: 'HDD 5', model: 'Seagate IronWolf 12TB', capacityBytes: tib(10.9), temperatureCelsius: 36, status: 'healthy', diskSlug: 'sde' },
  { name: 'HDD 6', model: 'Seagate IronWolf 12TB', capacityBytes: tib(10.9), temperatureCelsius: 37, status: 'healthy', diskSlug: 'sdf' }
];

const cpuCores = [
  { key: 'cpu0', name: 'CPU 0', usagePercent: 15.7, currentMHz: 1298, minMHz: 400, maxMHz: 4400, governor: 'powersave' },
  { key: 'cpu1', name: 'CPU 1', usagePercent: 17.0, currentMHz: 1302, minMHz: 400, maxMHz: 4400, governor: 'powersave' },
  { key: 'cpu2', name: 'CPU 2', usagePercent: 17.7, currentMHz: 1295, minMHz: 400, maxMHz: 4400, governor: 'powersave' },
  { key: 'cpu3', name: 'CPU 3', usagePercent: 17.4, currentMHz: 1288, minMHz: 400, maxMHz: 4400, governor: 'powersave' },
  { key: 'cpu4', name: 'CPU 4', usagePercent: 21.8, currentMHz: 1882, minMHz: 400, maxMHz: 4400, governor: 'powersave' },
  { key: 'cpu5', name: 'CPU 5', usagePercent: 23.8, currentMHz: 1900, minMHz: 400, maxMHz: 4400, governor: 'powersave' },
  { key: 'cpu6', name: 'CPU 6', usagePercent: 23.9, currentMHz: 1896, minMHz: 400, maxMHz: 4400, governor: 'powersave' },
  { key: 'cpu7', name: 'CPU 7', usagePercent: 21.7, currentMHz: 1874, minMHz: 400, maxMHz: 4400, governor: 'powersave' },
  { key: 'cpu8', name: 'CPU 8', usagePercent: 21.8, currentMHz: 1871, minMHz: 400, maxMHz: 4400, governor: 'powersave' },
  { key: 'cpu9', name: 'CPU 9', usagePercent: 21.7, currentMHz: 1865, minMHz: 400, maxMHz: 4400, governor: 'powersave' },
  { key: 'cpu10', name: 'CPU 10', usagePercent: 21.3, currentMHz: 1852, minMHz: 400, maxMHz: 4400, governor: 'powersave' },
  { key: 'cpu11', name: 'CPU 11', usagePercent: 20.8, currentMHz: 1836, minMHz: 400, maxMHz: 4400, governor: 'powersave' }
];

const ramBreakdown = [
  { key: 'total', label: 'Total', valueBytes: 62.5 * 1024 ** 3 },
  { key: 'used', label: 'Used', valueBytes: 13.7 * 1024 ** 3, totalBytes: 62.5 * 1024 ** 3 },
  { key: 'buffers', label: 'Buffers', valueBytes: 1.04 * 1024 ** 3, totalBytes: 62.5 * 1024 ** 3 },
  { key: 'cached', label: 'Cached', valueBytes: 47.2 * 1024 ** 3, totalBytes: 62.5 * 1024 ** 3 },
  { key: 'swap-used', label: 'Swap Used', valueBytes: 2.63 * 1024 ** 3, totalBytes: 37.3 * 1024 ** 3 },
  { key: 'swap-total', label: 'Swap Total', valueBytes: 37.3 * 1024 ** 3 }
];

const gpuEngines = [
  { key: 'blitter', label: 'Blitter', busyPercent: 4.2, semaPercent: 0.3, waitPercent: 0.8 },
  { key: 'render', label: 'Render', busyPercent: 32.0, semaPercent: 1.5, waitPercent: 3.2 },
  { key: 'video', label: 'Video', busyPercent: 18.6, semaPercent: 0.6, waitPercent: 1.1 },
  { key: 'video-enhance', label: 'VideoEnhance', busyPercent: 7.9, semaPercent: 0.1, waitPercent: 0.4 }
];

const gpuStats = [
  { key: 'frequency_actual_mhz', label: 'Actual Frequency', value: 0, unit: 'MHz' },
  { key: 'frequency_requested_mhz', label: 'Requested Frequency', value: 0, unit: 'MHz' },
  { key: 'imc_bandwidth_reads_mib_per_second', label: 'IMC Reads', value: 0, unit: 'MiB/s' },
  { key: 'imc_bandwidth_writes_mib_per_second', label: 'IMC Writes', value: 0, unit: 'MiB/s' },
  { key: 'interrupts_per_second', label: 'Interrupts', value: 0, unit: '/s' },
  { key: 'period_milliseconds', label: 'Sample Period', value: 16.9, unit: 'ms' },
  { key: 'power_gpu_watts', label: 'GPU Power', value: 0, unit: 'W' },
  { key: 'power_package_watts', label: 'Package Power', value: 17.4, unit: 'W' },
  { key: 'rc6_percent', label: 'RC6', value: 100, unit: '%' }
];

const topProcesses: ProcessDetail[] = [
  { key: 'taskmgr_serv', name: 'Taskmgr Serv', processCount: 1, cpuPercent: 5.24, memoryBytes: 49 * 1024 ** 2, cpuTimeSeconds: 1251.18 },
  { key: 'embyserver', name: 'EmbyServer', processCount: 1, cpuPercent: 4.67, memoryBytes: 612 * 1024 ** 2, cpuTimeSeconds: 18324.3 },
  { key: 'dockerd', name: 'dockerd', processCount: 1, cpuPercent: 2.82, memoryBytes: 184 * 1024 ** 2, cpuTimeSeconds: 5932.8 },
  { key: 'containerd', name: 'containerd', processCount: 1, cpuPercent: 2.09, memoryBytes: 132 * 1024 ** 2, cpuTimeSeconds: 4301.2 },
  { key: 'postgres', name: 'postgres', processCount: 4, cpuPercent: 1.81, memoryBytes: 318 * 1024 ** 2, cpuTimeSeconds: 7022.6 },
  { key: 'nginx', name: 'nginx', processCount: 6, cpuPercent: 1.26, memoryBytes: 144 * 1024 ** 2, cpuTimeSeconds: 1288.4 },
  { key: 'python3', name: 'python3', processCount: 2, cpuPercent: 0.96, memoryBytes: 228 * 1024 ** 2, cpuTimeSeconds: 2311.9 },
  { key: 'smbd', name: 'smbd', processCount: 3, cpuPercent: 0.63, memoryBytes: 96 * 1024 ** 2, cpuTimeSeconds: 418.5 },
  { key: 'redis-server', name: 'redis-server', processCount: 1, cpuPercent: 0.31, memoryBytes: 48 * 1024 ** 2, cpuTimeSeconds: 702.2 },
  { key: 'prometheus', name: 'prometheus', processCount: 1, cpuPercent: 0.22, memoryBytes: 354 * 1024 ** 2, cpuTimeSeconds: 1550.7 }
];

const networkTrafficHistory: TrafficPoint[] = [
  { timestampLabel: '14:25', totalsByInterface: { bond0: gbit(1.2), eth0: mbit(430), eth1: mbit(780) } },
  { timestampLabel: '14:25', totalsByInterface: { bond0: gbit(1.24), eth0: mbit(440), eth1: mbit(800) } },
  { timestampLabel: '14:25', totalsByInterface: { bond0: gbit(1.18), eth0: mbit(410), eth1: mbit(770) } },
  { timestampLabel: '14:26', totalsByInterface: { bond0: gbit(1.28), eth0: mbit(455), eth1: mbit(825) } },
  { timestampLabel: '14:26', totalsByInterface: { bond0: gbit(1.31), eth0: mbit(468), eth1: mbit(840) } },
  { timestampLabel: '14:26', totalsByInterface: { bond0: gbit(1.27), eth0: mbit(452), eth1: mbit(818) } },
  { timestampLabel: '14:27', totalsByInterface: { bond0: gbit(1.35), eth0: mbit(489), eth1: mbit(861) } },
  { timestampLabel: '14:27', totalsByInterface: { bond0: gbit(1.33), eth0: mbit(474), eth1: mbit(852) } },
  { timestampLabel: '14:27', totalsByInterface: { bond0: gbit(1.39), eth0: mbit(495), eth1: mbit(890) } },
  { timestampLabel: '14:28', totalsByInterface: { bond0: gbit(1.3), eth0: mbit(462), eth1: mbit(834) } },
  { timestampLabel: '14:28', totalsByInterface: { bond0: gbit(1.26), eth0: mbit(448), eth1: mbit(805) } },
  { timestampLabel: '14:29', totalsByInterface: { bond0: gbit(1.41), eth0: mbit(508), eth1: mbit(902) } },
  { timestampLabel: '14:29', totalsByInterface: { bond0: gbit(1.44), eth0: mbit(516), eth1: mbit(925) } },
  { timestampLabel: '14:30', totalsByInterface: { bond0: gbit(1.37), eth0: mbit(492), eth1: mbit(876) } },
  { timestampLabel: '14:30', totalsByInterface: { bond0: gbit(1.46), eth0: mbit(521), eth1: mbit(938) } }
];

export const fakeDashboardModel: NasDashboardModel = {
  deviceInfo: {
    model: 'DXP6800 Pro',
    ugosVersion: '1.2.0',
    hostname: 'DXP6800PRO',
    ipAddress: '192.168.1.100',
    uptimeSeconds: 12 * 24 * 3600 + 18 * 3600 + 42 * 60,
    lastUpdated: '2026-04-23 20:30'
  },
  hardwareSummary,
  hardwareDetails,
  drives,
  storagePools,
  dockerProjects,
  dockerTotals: dockerTotals(dockerProjects),
  networkInterfaces: [
    { name: 'bond0', status: 'up', linkSpeedMbps: 5000, temperatureCelsius: 38, downloadBps: mbit(620), uploadBps: mbit(580) },
    { name: 'eth0', status: 'up', linkSpeedMbps: 2500, temperatureCelsius: 37, downloadBps: mbit(240), uploadBps: mbit(190) },
    { name: 'eth1', status: 'up', linkSpeedMbps: 2500, temperatureCelsius: 39, downloadBps: mbit(380), uploadBps: mbit(400) }
  ],
  networkTrafficHistory,
  networkTrafficLines: [
    { key: 'bond0', label: 'bond0', color: THEME_COLORS.cyan, currentBps: gbit(1.46), series: networkTrafficHistory.map((point) => point.totalsByInterface.bond0) },
    { key: 'eth0', label: 'eth0', color: THEME_COLORS.good, currentBps: mbit(521), series: networkTrafficHistory.map((point) => point.totalsByInterface.eth0) },
    { key: 'eth1', label: 'eth1', color: THEME_COLORS.purple, currentBps: mbit(938), series: networkTrafficHistory.map((point) => point.totalsByInterface.eth1) }
  ],
  cpuCores,
  ramBreakdown,
  gpuEngines,
  gpuStats,
  topProcesses
};

export const createEmptyDashboardModel = (): NasDashboardModel => ({
  deviceInfo: {
    model: 'UGREEN NAS',
    ugosVersion: 'Unavailable',
    hostname: 'Unavailable',
    ipAddress: 'Unavailable',
    uptimeSeconds: 0,
    lastUpdated: 'Unavailable'
  },
  hardwareSummary: [
    { kind: 'cpu', title: 'CPU', accent: THEME_COLORS.blue, valuePercent: 0, temperatureCelsius: 0, series: [0, 0, 0, 0, 0, 0] },
    { kind: 'ram', title: 'RAM', accent: THEME_COLORS.purple, valuePercent: 0, usedBytes: 0, totalBytes: 0, series: [0, 0, 0, 0, 0, 0] },
    {
      kind: 'system-load',
      title: 'System Load',
      accent: THEME_COLORS.softBlue,
      value: 0,
      valuePercent: 0,
      valueText: '0.00%',
      unit: 'percent',
      statusText: 'Unavailable',
      series: [0, 0, 0, 0, 0, 0]
    },
    { kind: 'total-storage', title: 'Total Storage', accent: THEME_COLORS.cyan, totalBytes: 0, usedBytes: 0 },
    { kind: 'network', title: 'Network', accent: THEME_COLORS.green, downloadBps: 0, uploadBps: 0 }
  ],
  hardwareDetails: [
    {
      key: 'cpu',
      title: 'CPU',
      subtitle: 'No live data',
      accent: THEME_COLORS.blue,
      utilizationPercent: 0,
      series: [0, 0, 0, 0, 0, 0],
      detailRows: [
        { label: 'Load (1m)', value: 'Unavailable' },
        { label: 'Frequency', value: 'Unavailable' },
        { label: 'Temperature', value: 'Unavailable' },
        { label: 'Uptime', value: 'Unavailable' }
      ]
    },
    {
      key: 'ram',
      title: 'RAM',
      subtitle: 'No live data',
      accent: THEME_COLORS.purple,
      utilizationPercent: 0,
      series: [0, 0, 0, 0, 0, 0],
      detailRows: [
        { label: 'Used', value: 'Unavailable' },
        { label: 'Total', value: 'Unavailable' },
        { label: 'Usage', value: 'Unavailable' },
        { label: 'Swap Used', value: 'Unavailable' }
      ]
    }
  ],
  drives: [],
  storagePools: [],
  dockerProjects: [],
  dockerTotals: {
    totalContainers: 0,
    runningContainers: 0,
    totalProjects: 0,
    onlineProjects: 0
  },
  networkInterfaces: [],
  networkTrafficHistory: [
    { timestampLabel: '', totalsByInterface: {} },
    { timestampLabel: '', totalsByInterface: {} },
    { timestampLabel: '', totalsByInterface: {} },
    { timestampLabel: '', totalsByInterface: {} },
    { timestampLabel: '', totalsByInterface: {} }
  ],
  networkTrafficLines: [],
  cpuCores: [],
  ramBreakdown: [],
  gpuEngines: [],
  gpuStats: [],
  topProcesses: []
});
