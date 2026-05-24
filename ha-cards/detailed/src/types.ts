export interface HassEntityLike {
  entity_id?: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed?: string;
  last_updated?: string;
}

export interface HomeAssistantLike {
  states: Record<string, HassEntityLike>;
  callService?: (domain: string, service: string, data?: Record<string, unknown>) => void;
}

export interface CardConfig {
  type: string;
  title?: string;
  host?: string;
  deviceModel?: string;
  ugosVersion?: string;
  ipAddress?: string;
  ipEntity?: string;
  memoryTotalBytes?: number;
  storageFilesystems?: string[];
  networkInterfaces?: string[];
  accentGlow?: boolean;
}

export type HardwareMetricKey = 'cpu' | 'ram' | 'gpu';
export type SummaryMetricKind = HardwareMetricKey | 'system-load' | 'total-storage' | 'network';
export type HealthStatus = 'healthy' | 'warning' | 'degraded';
export type ProjectStatus = 'up' | 'partial' | 'down';
export type InterfaceStatus = 'up' | 'down';
export type KnownDockerProjectKey =
  | 'gitea'
  | 'go_back_db'
  | 'gorent'
  | 'home-assistant'
  | 'jellyfin'
  | 'kuma_monitoring'
  | 'monitoring'
  | 'nas'
  | 'torrent'
  | 'virtual_machines'
  | 'webserver';
export type DockerProjectKey = KnownDockerProjectKey | (string & {});

export interface NasDeviceInfo {
  model: string;
  ugosVersion: string;
  hostname: string;
  ipAddress: string;
  uptimeSeconds: number;
  lastUpdated: string;
}

export interface BaseSummaryCard {
  kind: SummaryMetricKind;
  title: string;
  accent: string;
  series?: number[];
}

export interface UtilizationSummaryCard extends BaseSummaryCard {
  kind: 'cpu' | 'gpu';
  valuePercent: number;
  temperatureCelsius: number;
}

export interface MemorySummaryCard extends BaseSummaryCard {
  kind: 'ram';
  valuePercent: number;
  usedBytes: number;
  totalBytes: number;
}

export interface LoadSummaryCard extends BaseSummaryCard {
  kind: 'system-load';
  value: number;
  valuePercent: number;
  valueText: string;
  unit: 'load' | 'percent';
  statusText: string;
}

export interface TotalStorageSummaryCard extends BaseSummaryCard {
  kind: 'total-storage';
  totalBytes: number;
  usedBytes: number;
}

export interface NetworkSummaryCard extends BaseSummaryCard {
  kind: 'network';
  downloadBps: number;
  uploadBps: number;
}

export type HardwareSummaryCard =
  | UtilizationSummaryCard
  | MemorySummaryCard
  | LoadSummaryCard
  | TotalStorageSummaryCard
  | NetworkSummaryCard;

export interface MetricDetailRow {
  label: string;
  value: string;
}

export interface HardwareMetricCard {
  key: HardwareMetricKey;
  title: string;
  subtitle: string;
  accent: string;
  utilizationPercent: number;
  series: number[];
  detailRows: MetricDetailRow[];
}

export interface DriveInfo {
  name: string;
  model: string;
  capacityBytes: number;
  temperatureCelsius?: number;
  readBytesPerSecond?: number;
  writeBytesPerSecond?: number;
  busyPercent?: number;
  status: HealthStatus;
  mediaType?: string;
  diskSlug?: string;
  deviceModel?: string;
}

export interface StoragePool {
  name: string;
  layout: string;
  driveCountText?: string;
  status: HealthStatus;
  usedBytes: number;
  totalBytes: number;
  accent: string;
  key?: string;
  driveSlugs?: string[];
}

export interface DockerProject {
  key: DockerProjectKey;
  title: string;
  cpuPercent: number;
  memoryBytes: number;
  runningContainers: number;
  totalContainers: number;
  status: ProjectStatus;
  containers: DockerContainer[];
}

export interface DockerTotals {
  totalContainers: number;
  runningContainers: number;
  totalProjects: number;
  onlineProjects: number;
}

export interface NetworkInterfaceInfo {
  name: string;
  status: InterfaceStatus;
  linkSpeedMbps?: number;
  temperatureCelsius?: number;
  downloadBps: number;
  uploadBps: number;
}

export interface TrafficPoint {
  timestampLabel: string;
  totalsByInterface: Record<string, number>;
}

export interface TrafficLine {
  key: string;
  label: string;
  color: string;
  currentBps: number;
  series: number[];
}

export interface DockerContainer {
  key: string;
  name: string;
  image: string;
  status: string;
  state: string;
  running: boolean;
  cpuPercent: number;
  memoryBytes: number;
  memoryCurrentBytes?: number;
  memoryLimitBytes?: number;
}

export interface CpuCoreDetail {
  key: string;
  name: string;
  usagePercent: number;
  currentMHz?: number;
  minMHz?: number;
  maxMHz?: number;
  governor?: string;
}

export interface RamBreakdownItem {
  key: string;
  label: string;
  valueBytes: number;
  totalBytes?: number;
}

export interface GpuEngineDetail {
  key: string;
  label: string;
  busyPercent: number;
  semaPercent?: number;
  waitPercent?: number;
}

export interface GpuStatDetail {
  key: string;
  label: string;
  value: number;
  unit?: string;
}

export interface ProcessDetail {
  key: string;
  name: string;
  processCount: number;
  cpuPercent: number;
  memoryBytes: number;
  cpuTimeSeconds?: number;
}

export interface NasDashboardModel {
  deviceInfo: NasDeviceInfo;
  hardwareSummary: HardwareSummaryCard[];
  hardwareDetails: HardwareMetricCard[];
  drives: DriveInfo[];
  storagePools: StoragePool[];
  dockerProjects: DockerProject[];
  dockerTotals: DockerTotals;
  networkInterfaces: NetworkInterfaceInfo[];
  networkTrafficHistory: TrafficPoint[];
  networkTrafficLines: TrafficLine[];
  cpuCores: CpuCoreDetail[];
  ramBreakdown: RamBreakdownItem[];
  gpuEngines: GpuEngineDetail[];
  gpuStats: GpuStatDetail[];
  topProcesses: ProcessDetail[];
}
