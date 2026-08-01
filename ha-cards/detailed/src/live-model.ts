import { THEME_COLORS } from './theme';
import type {
  CardConfig,
  CpuCoreDetail,
  DockerContainer,
  DockerProject,
  DriveInfo,
  GpuEngineDetail,
  GpuStatDetail,
  HassEntityLike,
  HardwareMetricCard,
  HardwareSummaryCard,
  HealthStatus,
  HomeAssistantLike,
  NasDashboardModel,
  NetworkInterfaceInfo,
  ProcessDetail,
  RamBreakdownItem,
  StoragePool,
  TrafficPoint
} from './types';

const HISTORY_LIMIT = 21;
const STORAGE_POOL_ACCENTS = [THEME_COLORS.green, THEME_COLORS.cyan, THEME_COLORS.purple, THEME_COLORS.softBlue];
const hostCpuRegex = /^sensor\.ugos_bridge_host_(.+?)_cpu_usage_percent$/;
const projectCpuRegex = /^sensor\.ugos_bridge_project_(.+?)_cpu_usage_percent$/;
const legacyHostCpuRegex = /^sensor\.([a-z0-9_]+)_\1_cpu(?:_|$)/;
const bridgeHostChildRegex =
  /^(?:sensor|binary_sensor)\.ugos_bridge_host_(.+?)_(?:array|bond|cooling|disk|filesystem|gpu|health|network|software|ups)_/;
const haNamedHostChildRegex =
  /^(?:sensor|binary_sensor)\.([a-z0-9_]+)_(?:array|bond|cooling|disk|filesystem|gpu|health|network|software|ups)_[a-z0-9][a-z0-9_]*_[a-z0-9_]+(?:_\d+)?$/;
const containerEntityRegex =
  /^(?:sensor|binary_sensor)\.ugos_bridge_container_(.+?)_(cpu_usage_percent|memory_usage_bytes|running)$/;
const vmEntityRegex =
  /^(?:sensor|binary_sensor)\.ugos_bridge_vm_(.+?)_(cpu_usage_percent|memory_usage_bytes|running)$/;
const processEntityRegex =
  /^sensor\.ugos_bridge_process_(.+?)_(process_count|cpu_usage_percent|memory_usage_bytes|cpu_time_seconds)$/;

interface MetricHistorySample {
  key: string;
  timestampLabel: string;
  cpuPercent: number;
  ramPercent: number;
  gpuPercent: number;
  load1: number;
  networkBpsBySlug: Record<string, number>;
}

export interface MetricHistoryState {
  samples: MetricHistorySample[];
}

export interface LiveDashboardBuildResult {
  history: MetricHistoryState;
  model: NasDashboardModel;
  watchEntityIds: string[];
  watchPrefixes: string[];
}

interface FilesystemSnapshot {
  slug: string;
  name: string;
  usedBytes: number;
  freeBytes: number;
  totalBytes: number;
  readOnly: boolean;
}

interface ArraySnapshot {
  slug: string;
  name: string;
  sizeBytes: number;
  degradedDisks: number;
  activeDisks?: number;
  totalDisks?: number;
  syncPercent?: number;
  level?: string;
  members: string[];
}

interface TemperatureSnapshot {
  entityId: string;
  label: string;
  value: number;
}

interface HostLoadMetric {
  value: number;
  valuePercent: number;
  valueText: string;
  unit: 'load' | 'percent';
  statusText: string;
}

interface StateScanCache {
  keys?: string[];
  entries?: Array<[string, HassEntityLike]>;
  values?: HassEntityLike[];
  prefixEntries: Map<string, Array<[string, HassEntityLike]>>;
  computedResults: Map<string, unknown>;
  resolutionResults: Map<string, string | undefined>;
  booleanResults: Map<string, boolean>;
}

interface EntityDerivedCache {
  friendlyName: string;
  friendlyNameLower: string;
  state: string;
  unit?: string;
  parsedNumber?: number | null;
  textState?: string | null;
}

type HostMetric =
  | 'cpu'
  | 'load1'
  | 'cpufreq'
  | 'memoryUsedBytes'
  | 'memoryUsedPercent'
  | 'swapUsedPercent'
  | 'uptime';

const hostMetricAttributeKeys: Record<HostMetric, string> = {
  cpu: 'cpu_usage_percent',
  load1: 'load_1',
  cpufreq: 'cpu_frequency_mhz',
  memoryUsedBytes: 'memory_used_bytes',
  memoryUsedPercent: 'memory_used_percent',
  swapUsedPercent: 'swap_used_percent',
  uptime: 'uptime_seconds'
};

const stateScanCaches = new WeakMap<Record<string, HassEntityLike>, StateScanCache>();
const entityDerivedCaches = new WeakMap<HassEntityLike, EntityDerivedCache>();

const getStateScanCache = (states: Record<string, HassEntityLike>): StateScanCache => {
  let cache = stateScanCaches.get(states);
  if (!cache) {
    cache = {
      prefixEntries: new Map(),
      computedResults: new Map(),
      resolutionResults: new Map(),
      booleanResults: new Map()
    };
    stateScanCaches.set(states, cache);
  }
  return cache;
};

const getStateKeys = (states: Record<string, HassEntityLike>): string[] => {
  const cache = getStateScanCache(states);
  if (!cache.keys) {
    cache.keys = Object.keys(states);
  }
  return cache.keys;
};

const getStateEntries = (states: Record<string, HassEntityLike>): Array<[string, HassEntityLike]> => {
  const cache = getStateScanCache(states);
  if (!cache.entries) {
    cache.entries = Object.entries(states);
  }
  return cache.entries;
};

const getStateValues = (states: Record<string, HassEntityLike>): HassEntityLike[] => {
  const cache = getStateScanCache(states);
  if (!cache.values) {
    cache.values = Object.values(states);
  }
  return cache.values;
};

const getEntriesByPrefix = (
  states: Record<string, HassEntityLike>,
  prefix: string
): Array<[string, HassEntityLike]> => {
  const cache = getStateScanCache(states);
  const cached = cache.prefixEntries.get(prefix);
  if (cached) {
    return cached;
  }

  const entries = getStateEntries(states).filter(([entityId]) => entityId.startsWith(prefix));
  cache.prefixEntries.set(prefix, entries);
  return entries;
};

const getEntriesByPrefixes = (
  states: Record<string, HassEntityLike>,
  prefixes: string[]
): Array<[string, HassEntityLike]> =>
  Array.from(new Map(prefixes.flatMap((prefix) => getEntriesByPrefix(states, prefix))).entries());

const firstExistingEntityId = (
  states: Record<string, HassEntityLike>,
  entityIds: string[]
): string | undefined => entityIds.find((entityId) => isUsableEntityState(states[entityId]));

const getPayloadNamedEntries = (
  states: Record<string, HassEntityLike>,
  component: 'array' | 'bond' | 'disk' | 'filesystem' | 'gpu' | 'network',
  slug: string,
  domainPrefix = 'sensor.'
): Array<[string, HassEntityLike]> => {
  const normalizedSlug = slugify(slug);
  return getStateEntries(states).filter(([entityId, entity]) => {
    if (!entityId.startsWith(domainPrefix)) {
      return false;
    }

    const entityText = entityId.toLowerCase();
    const payloadNameSlug = slugify(getStringAttribute(entity, 'name') ?? '');
    return (
      payloadNameSlug === normalizedSlug ||
      entityText.includes(`_${component}_${normalizedSlug}_`) ||
      entityText.includes(`ugos_bridge_${component}_${normalizedSlug}_`)
    );
  });
};

const findBestMetricEntityId = (
  entries: Array<[string, HassEntityLike]>,
  options: {
    entityIncludes: string[];
    friendlyIncludes: string[];
    unit?: string;
  }
): string | undefined => findBestEntityId(entries, options) ?? findBestEntityId(entries, { ...options, unit: undefined });

const getComputedResult = <T>(
  states: Record<string, HassEntityLike>,
  key: string,
  compute: () => T
): T => {
  const cache = getStateScanCache(states);
  const cached = cache.computedResults.get(key);
  if (cached !== undefined) {
    return cached as T;
  }

  const value = compute();
  cache.computedResults.set(key, value);
  return value;
};

const resolveCachedEntityId = (
  states: Record<string, HassEntityLike>,
  key: string,
  resolve: () => string | undefined
): string | undefined => {
  const cache = getStateScanCache(states);
  if (cache.resolutionResults.has(key)) {
    return cache.resolutionResults.get(key);
  }

  const value = resolve();
  cache.resolutionResults.set(key, value);
  return value;
};

const getEntityDerivedCache = (entity: HassEntityLike | undefined): EntityDerivedCache | undefined => {
  if (!entity) {
    return undefined;
  }

  let cache = entityDerivedCaches.get(entity);
  const friendlyName = typeof entity.attributes.friendly_name === 'string' ? entity.attributes.friendly_name : '';
  const unit = normalizeUnit(typeof entity.attributes.unit_of_measurement === 'string' ? entity.attributes.unit_of_measurement : undefined);
  if (!cache || cache.friendlyName !== friendlyName || cache.unit !== unit) {
    cache = {
      friendlyName,
      friendlyNameLower: friendlyName.toLowerCase(),
      state: entity.state,
      unit
    };
    entityDerivedCaches.set(entity, cache);
  } else if (cache.state !== entity.state) {
    cache.state = entity.state;
    cache.parsedNumber = undefined;
    cache.textState = undefined;
  }

  return cache;
};

export const emptyMetricHistoryState = (): MetricHistoryState => ({ samples: [] });

export const buildLiveDashboardModel = (
  hass: HomeAssistantLike | undefined,
  config: CardConfig | undefined,
  previousHistory: MetricHistoryState
): LiveDashboardBuildResult | null => {
  const states = hass?.states;
  if (!states) {
    return null;
  }

  // Home Assistant can reuse the same states object while entities are still arriving.
  // Keep scan/resolution caches scoped to this one model build so child entities are not missed.
  stateScanCaches.delete(states);

  const hostSlug = resolveHostSlug(states, config?.host);
  if (!hostSlug) {
    return null;
  }

  const hostPrefix = `ugos_bridge_host_${hostSlug}`;
  const hostCpuEntityId = resolveHostMetricEntityId(states, hostSlug, 'cpu');
  const hostMemoryEntityId = resolveHostMetricEntityId(states, hostSlug, 'memoryUsedBytes');
  const cpuPercent = getHostMetricValue(states, hostSlug, 'cpu') ?? 0;
  const loadMetric = getHostLoadMetric(states, hostSlug);
  const load1 = loadMetric.value;
  const cpuFrequencyMHz = getHostMetricValue(states, hostSlug, 'cpufreq');
  const uptimeSeconds = getHostMetricValue(states, hostSlug, 'uptime') ?? 0;
  const memoryUsedBytes = getHostMetricValue(states, hostSlug, 'memoryUsedBytes') ?? 0;
  const memoryUsedPercent = getHostMetricValue(states, hostSlug, 'memoryUsedPercent') ?? 0;
  const swapUsedPercent = getHostMetricValue(states, hostSlug, 'swapUsedPercent') ?? 0;
  const memoryTotalBytes = resolveMemoryTotalBytes(memoryUsedBytes, memoryUsedPercent, config?.memoryTotalBytes);
  const hostName = resolveHostDisplayName(states, hostSlug, config?.host);
  const cpuCores = buildCpuCoreDetails(states, hostCpuEntityId);
  const ramBreakdown = buildRamBreakdown(states, hostMemoryEntityId, memoryTotalBytes, memoryUsedBytes);
  const topProcesses = buildTopProcesses(states);

  const temperatures = collectTemperatureSnapshots(states, hostSlug);
  const cpuTemperature = pickTemperature(temperatures, ['cpu', 'package', 'soc', 'core', 'tctl']);

  const gpuSlugs = collectGpuSlugs(states, hostSlug, hostPrefix);
  const primaryGpuSlug = gpuSlugs[0];
  const primaryGpuBusyEntityId =
    primaryGpuSlug !== undefined
      ? resolveGpuMetricEntityId(states, hostSlug, hostPrefix, primaryGpuSlug, 'busy')
      : undefined;
  const primaryGpuCurrentEntityId =
    primaryGpuSlug !== undefined
      ? resolveGpuMetricEntityId(states, hostSlug, hostPrefix, primaryGpuSlug, 'current')
      : undefined;
  const primaryGpuMaxEntityId =
    primaryGpuSlug !== undefined
      ? resolveGpuMetricEntityId(states, hostSlug, hostPrefix, primaryGpuSlug, 'max')
      : undefined;
  const gpuBusyPercent =
    primaryGpuSlug !== undefined
      ? resolveGpuBusyPercent(states, hostSlug, hostPrefix, primaryGpuSlug)
      : undefined;
  const gpuCurrentMHz =
    primaryGpuSlug !== undefined
      ? getNumberState(states, primaryGpuCurrentEntityId)
      : undefined;
  const gpuMaxMHz =
    primaryGpuSlug !== undefined
      ? getNumberState(states, primaryGpuMaxEntityId)
      : undefined;
  const gpuTemperature = pickTemperature(temperatures, ['gpu', 'graphics', 'igpu', 'intel']);
  const gpuDetailEntityIds =
    primaryGpuSlug !== undefined
      ? resolveGpuDetailEntityIds(states, hostSlug, hostPrefix, primaryGpuSlug, [
          primaryGpuBusyEntityId,
          primaryGpuCurrentEntityId,
          primaryGpuMaxEntityId
        ])
      : [];
  const gpuEngines = buildGpuEngineDetails(states, gpuDetailEntityIds);
  const gpuStats = buildGpuStatDetails(
    states,
    gpuDetailEntityIds
  );

  const filesystems = collectFilesystems(states, hostSlug);
  const storageFilesystems = selectFilesystems(filesystems, config?.storageFilesystems);

  const diskSlugs = collectDiskSlugs(states, hostSlug, hostPrefix);
  const drives = diskSlugs
    .map((diskSlug) => buildDrive(states, hostSlug, hostName, diskSlug))
    .filter((drive): drive is DriveInfo => drive !== null)
    .sort((left, right) => left.name.localeCompare(right.name));

  const arrays = collectArrays(states, hostSlug);
  const storagePools = buildStoragePools(arrays, storageFilesystems, drives);

  const projectSlugs = collectProjectSlugs(states);
  const dockerProjects = Array.from(new Set(projectSlugs))
    .map((projectSlug) => buildProject(states, projectSlug))
    .filter((project): project is DockerProject => project !== null)
    .sort((left, right) => right.cpuPercent - left.cpuPercent || left.title.localeCompare(right.title));

  const networkSlugs = collectNetworkSlugs(states, hostSlug, hostPrefix);
  const bondSlugs = collectBondSlugs(states, hostSlug, hostPrefix);
  const discoveredNetworkSlugs = Array.from(new Set([...networkSlugs, ...bondSlugs])).sort();
  const selectedNetworkSlugs = selectSlugs(
    preferPrimaryNetworkSlugs(discoveredNetworkSlugs, config?.networkInterfaces),
    config?.networkInterfaces
  );
  const networkInterfaces = selectedNetworkSlugs
    .map((networkSlug) =>
      networkSlugs.includes(networkSlug)
        ? buildNetworkInterface(states, hostSlug, networkSlug, temperatures)
        : buildBondInterface(states, hostSlug, networkSlug, temperatures)
    )
    .filter((network): network is NetworkInterfaceInfo => network !== null)
    .sort((left, right) => left.name.localeCompare(right.name));

  const chartNetworkSlugs = selectedNetworkSlugs.filter((networkSlug) => networkSlugs.includes(networkSlug));
  const trafficNetworkSlugs = chartNetworkSlugs.length > 0 ? chartNetworkSlugs : networkSlugs;
  const totalDownloadBps = trafficNetworkSlugs.reduce(
    (total, networkSlug) => total + ((getNumberState(states, resolveNetworkMetricEntityId(states, hostSlug, networkSlug, 'rx')) ?? 0) * 8),
    0
  );
  const totalUploadBps = trafficNetworkSlugs.reduce(
    (total, networkSlug) => total + ((getNumberState(states, resolveNetworkMetricEntityId(states, hostSlug, networkSlug, 'tx')) ?? 0) * 8),
    0
  );
  const trafficLineSlugs = prioritizeTrafficLineSlugs(selectedNetworkSlugs);
  const networkBpsBySlug = Object.fromEntries(
    trafficLineSlugs.map((networkSlug) => [networkSlug, resolveInterfaceTotalBps(states, hostSlug, networkSlug)])
  );

  const sampleKey =
    (hostCpuEntityId ? states[hostCpuEntityId]?.last_updated : undefined) ??
    (hostCpuEntityId ? states[hostCpuEntityId]?.last_changed : undefined) ??
    `${cpuPercent}:${memoryUsedPercent}:${gpuBusyPercent ?? 0}:${totalDownloadBps}:${totalUploadBps}:${JSON.stringify(networkBpsBySlug)}`;
  const history = pushHistorySample(previousHistory, {
    key: sampleKey,
    timestampLabel: formatTimeLabel(sampleKey),
    cpuPercent,
    ramPercent: memoryUsedPercent,
    gpuPercent: gpuBusyPercent ?? 0,
    load1,
    networkBpsBySlug
  });

  const cpuSeries = ensureSeries(history.samples.map((sample) => sample.cpuPercent), cpuPercent, 12);
  const ramSeries = ensureSeries(history.samples.map((sample) => sample.ramPercent), memoryUsedPercent, 12);
  const gpuSeries = ensureSeries(history.samples.map((sample) => sample.gpuPercent), gpuBusyPercent ?? 0, 12);
  const loadSeries = ensureSeries(history.samples.map((sample) => sample.load1), load1, 12);
  const networkTrafficHistory = ensureTrafficSeries(history.samples, trafficLineSlugs, networkBpsBySlug);
  const networkTrafficLines = trafficLineSlugs.map((networkSlug, index) => ({
    key: networkSlug,
    label: normalizeInterfaceName(networkSlug),
    color: trafficLineColor(networkSlug, index),
    currentBps: networkBpsBySlug[networkSlug] ?? 0,
    series: networkTrafficHistory.map((point) => point.totalsByInterface[networkSlug] ?? 0)
  }));

  const hardwareSummary: HardwareSummaryCard[] = [
    {
      kind: 'cpu',
      title: 'CPU',
      accent: THEME_COLORS.blue,
      valuePercent: cpuPercent,
      temperatureCelsius: cpuTemperature ?? 0,
      series: cpuSeries
    },
    {
      kind: 'ram',
      title: 'RAM',
      accent: THEME_COLORS.purple,
      valuePercent: memoryUsedPercent,
      usedBytes: memoryUsedBytes,
      totalBytes: memoryTotalBytes,
      series: ramSeries
    },
    ...(gpuBusyPercent !== undefined
      ? [
          {
            kind: 'gpu' as const,
            title: 'GPU',
            accent: THEME_COLORS.green,
            valuePercent: gpuBusyPercent,
            temperatureCelsius: gpuTemperature ?? 0,
            series: gpuSeries
          }
        ]
      : []),
    {
      kind: 'system-load',
      title: 'System Load',
      accent: THEME_COLORS.softBlue,
      value: load1,
      valuePercent: loadMetric.valuePercent,
      valueText: loadMetric.valueText,
      unit: loadMetric.unit,
      statusText: loadMetric.statusText,
      series: loadSeries
    },
    {
      kind: 'network',
      title: 'Network',
      accent: THEME_COLORS.green,
      downloadBps: totalDownloadBps,
      uploadBps: totalUploadBps
    }
  ];

  const hardwareDetails: HardwareMetricCard[] = buildHardwareDetails({
    cpuFrequencyMHz,
    cpuPercent,
    cpuSeries,
    cpuTemperature,
    gpuBusyPercent,
    gpuCurrentMHz,
    gpuMaxMHz,
    gpuSeries,
    gpuTemperature,
    load1,
    loadValueText: loadMetric.valueText,
    memoryTotalBytes,
    memoryUsedBytes,
    memoryUsedPercent,
    ramSeries,
    swapUsedPercent,
    uptimeSeconds
  });

  const watchPrefixes = buildWatchPrefixes(hostSlug);
  const watchEntityIds = collectWatchedEntityIds(states, watchPrefixes, config?.ipEntity);

  return {
    history,
    watchEntityIds,
    watchPrefixes,
    model: {
      deviceInfo: {
        model: config?.deviceModel ?? 'UGREEN NAS',
        ugosVersion: config?.ugosVersion ?? 'Unavailable',
        hostname: hostName,
        ipAddress: resolveIPAddress(states, config),
        uptimeSeconds,
        lastUpdated: formatDateTime(sampleKey)
      },
      hardwareSummary,
      hardwareDetails,
      drives,
      storagePools,
      dockerProjects,
      dockerTotals: {
        totalContainers: dockerProjects.reduce((total, project) => total + project.totalContainers, 0),
        runningContainers: dockerProjects.reduce((total, project) => total + project.runningContainers, 0),
        totalProjects: dockerProjects.length,
        onlineProjects: dockerProjects.filter((project) => project.status === 'up').length
      },
      networkInterfaces,
      networkTrafficHistory,
      networkTrafficLines,
      cpuCores,
      ramBreakdown,
      gpuEngines,
      gpuStats,
      topProcesses
    }
  };
};

const buildHardwareDetails = ({
  cpuFrequencyMHz,
  cpuPercent,
  cpuSeries,
  cpuTemperature,
  gpuBusyPercent,
  gpuCurrentMHz,
  gpuMaxMHz,
  gpuSeries,
  gpuTemperature,
  load1,
  loadValueText,
  memoryTotalBytes,
  memoryUsedBytes,
  memoryUsedPercent,
  ramSeries,
  swapUsedPercent,
  uptimeSeconds
}: {
  cpuFrequencyMHz?: number;
  cpuPercent: number;
  cpuSeries: number[];
  cpuTemperature?: number;
  gpuBusyPercent?: number;
  gpuCurrentMHz?: number;
  gpuMaxMHz?: number;
  gpuSeries: number[];
  gpuTemperature?: number;
  load1: number;
  loadValueText: string;
  memoryTotalBytes: number;
  memoryUsedBytes: number;
  memoryUsedPercent: number;
  ramSeries: number[];
  swapUsedPercent: number;
  uptimeSeconds: number;
}): HardwareMetricCard[] => {
  const hardwareDetails: HardwareMetricCard[] = [
    {
      key: 'cpu',
      title: 'CPU',
      subtitle: 'System Processor',
      accent: THEME_COLORS.blue,
      utilizationPercent: cpuPercent,
      series: cpuSeries,
      detailRows: [
        { label: 'Load (1m)', value: loadValueText },
        { label: 'Frequency', value: cpuFrequencyMHz ? `${Math.round(cpuFrequencyMHz)} MHz` : 'Unavailable' },
        { label: 'Temperature', value: cpuTemperature !== undefined ? `${Math.round(cpuTemperature)}\u00B0C` : 'Unavailable' },
        { label: 'Uptime', value: humanizeUptime(uptimeSeconds) }
      ]
    },
    {
      key: 'ram',
      title: 'RAM',
      subtitle: 'System Memory',
      accent: THEME_COLORS.purple,
      utilizationPercent: memoryUsedPercent,
      series: ramSeries,
      detailRows: [
        { label: 'Used', value: formatStorageBytes(memoryUsedBytes) },
        { label: 'Total', value: formatStorageBytes(memoryTotalBytes) },
        { label: 'Usage', value: `${memoryUsedPercent.toFixed(memoryUsedPercent >= 10 ? 1 : 2)}%` },
        { label: 'Swap Used', value: `${swapUsedPercent.toFixed(swapUsedPercent >= 10 ? 1 : 2)}%` }
      ]
    }
  ];

  if (gpuBusyPercent !== undefined) {
    hardwareDetails.push({
      key: 'gpu',
      title: 'GPU',
      subtitle: 'Integrated Graphics',
      accent: THEME_COLORS.green,
      utilizationPercent: gpuBusyPercent,
      series: gpuSeries,
      detailRows: [
        { label: 'Current', value: gpuCurrentMHz ? `${Math.round(gpuCurrentMHz)} MHz` : 'Unavailable' },
        { label: 'Max', value: gpuMaxMHz ? `${Math.round(gpuMaxMHz)} MHz` : 'Unavailable' },
        { label: 'Temperature', value: gpuTemperature !== undefined ? `${Math.round(gpuTemperature)}\u00B0C` : 'Unavailable' },
        { label: 'Source', value: 'UGOS Bridge MQTT' }
      ]
    });
  }

  return hardwareDetails;
};

const buildDrive = (
  states: Record<string, HassEntityLike>,
  hostSlug: string,
  hostName: string,
  diskSlug: string
): DriveInfo | null => {
  const sizeEntityId = resolveDiskMetricEntityId(states, hostSlug, diskSlug, 'size');
  const capacityBytes = getNumberState(states, sizeEntityId);
  const temperatureCelsius = getNumberState(states, resolveDiskMetricEntityId(states, hostSlug, diskSlug, 'temperature'));
  const readBytesPerSecond = getNumberState(states, resolveDiskMetricEntityId(states, hostSlug, diskSlug, 'read'));
  const writeBytesPerSecond = getNumberState(states, resolveDiskMetricEntityId(states, hostSlug, diskSlug, 'write'));
  const busyPercent = getNumberState(states, resolveDiskMetricEntityId(states, hostSlug, diskSlug, 'busy'));
  const diskModel = getTextState(states, resolveDiskTextMetricEntityId(states, hostSlug, diskSlug, 'model'));
  const mediaType = normalizeDiskMediaType(getTextState(states, resolveDiskTextMetricEntityId(states, hostSlug, diskSlug, 'type')));
  if (
    capacityBytes === undefined &&
    temperatureCelsius === undefined &&
    readBytesPerSecond === undefined &&
    writeBytesPerSecond === undefined &&
    busyPercent === undefined &&
    diskModel === undefined &&
    mediaType === undefined
  ) {
    return null;
  }

  const cleanModel = normalizeDiskModel(diskModel);
  const deviceName = getStringAttribute(states[sizeEntityId ?? ''], 'name');
  const fallbackName =
    cleanupFriendlyName(
      states[sizeEntityId ?? ''],
      'Size',
      hostName
    ) ?? deviceName ?? toDisplayName(diskSlug);
  const deviceLabel = deviceName ?? diskSlug;

  return {
    name:
      mediaType === 'hdd'
        ? `${cleanModel ?? fallbackName} ${deviceLabel.toUpperCase()}`
        : cleanModel ?? fallbackName,
    model: mediaType ? mediaType.toUpperCase() : temperatureCelsius !== undefined ? 'Physical Disk' : 'Disk',
    capacityBytes: capacityBytes ?? 0,
    temperatureCelsius,
    readBytesPerSecond,
    writeBytesPerSecond,
    busyPercent,
    status: deriveDriveStatus(temperatureCelsius),
    mediaType,
    diskSlug,
    deviceName,
    deviceModel: cleanModel ?? undefined
  };
};

const buildStoragePools = (arrays: ArraySnapshot[], filesystems: FilesystemSnapshot[], drives: DriveInfo[]): StoragePool[] => {
  if (arrays.length === 0) {
    return filesystems.map((filesystem, index) => ({
      key: filesystem.slug,
      name: filesystemToLabel(filesystemNameFromSlug(filesystem.slug)),
      layout: filesystem.readOnly ? 'Filesystem | Read-only' : 'Filesystem',
      status: filesystem.readOnly ? 'warning' : 'healthy',
      usedBytes: filesystem.usedBytes,
      totalBytes: filesystem.totalBytes,
      accent: STORAGE_POOL_ACCENTS[index % STORAGE_POOL_ACCENTS.length]
    }));
  }

  const remainingFilesystems = [...filesystems];
  return arrays.map((array, index) => {
    const filesystemIndex = remainingFilesystems.findIndex(
      (filesystem) => Math.abs(filesystem.totalBytes - array.sizeBytes) / Math.max(array.sizeBytes, 1) < 0.05
    );
    const matchedFilesystem = filesystemIndex >= 0 ? remainingFilesystems.splice(filesystemIndex, 1)[0] : undefined;
    const mediaLabel = inferArrayMediaLabel(array, drives);
    const volumeLabel = matchedFilesystem ? filesystemToLabel(filesystemNameFromSlug(matchedFilesystem.slug)) : undefined;
    const arrayLevel = normalizeArrayLevel(array.level);
    const mappedDriveSlugs = mapArrayMembersToDriveSlugs(array.members, drives);
    const fallbackDriveSlugs =
      mappedDriveSlugs.length === 0 && arrays.length === 1
        ? drives.map((drive) => drive.diskSlug).filter((slug): slug is string => Boolean(slug))
        : mappedDriveSlugs;

    return {
      key: array.slug,
      name: mediaLabel ?? volumeLabel ?? array.name,
      layout: [arrayLevel, volumeLabel].filter(Boolean).join(' | ') || `${array.slug.toUpperCase()} Array`,
      driveCountText: formatArrayDriveCounts(array.activeDisks, array.totalDisks),
      status: array.degradedDisks > 0 ? 'degraded' : matchedFilesystem?.readOnly ? 'warning' : 'healthy',
      usedBytes: matchedFilesystem?.usedBytes ?? 0,
      totalBytes: matchedFilesystem?.totalBytes ?? array.sizeBytes,
      accent: STORAGE_POOL_ACCENTS[index % STORAGE_POOL_ACCENTS.length],
      driveSlugs: fallbackDriveSlugs
    };
  });
};

const buildProject = (states: Record<string, HassEntityLike>, projectSlug: string): DockerProject | null => {
  const projectEntityId = resolveProjectPayloadEntityId(states, projectSlug);
  const cpuEntityId = resolveProjectMetricEntityId(states, projectSlug, 'cpu');
  const projectEntity = states[projectEntityId ?? ''];
  const cpuPercent = getNumberAttribute(projectEntity, 'cpu_usage_percent') ?? getNumberState(states, cpuEntityId);
  const memoryBytes =
    getNumberAttribute(projectEntity, 'memory_usage_bytes') ??
    getNumberState(states, resolveProjectMetricEntityId(states, projectSlug, 'memory'));
  const totalContainers =
    getNumberAttribute(projectEntity, 'total_containers') ?? getNumberState(states, resolveProjectMetricEntityId(states, projectSlug, 'total'));
  const runningContainers =
    getNumberAttribute(projectEntity, 'running_containers') ??
    getNumberState(states, resolveProjectMetricEntityId(states, projectSlug, 'running'));
  if (cpuPercent === undefined || memoryBytes === undefined || totalContainers === undefined || runningContainers === undefined) {
    return null;
  }
  const containers = normalizeProjectContainers(projectSlug, collectProjectContainers(states, projectSlug, projectEntityId ?? cpuEntityId));
  const effectiveMemoryBytes = resolveProjectMemoryBytes(projectSlug, memoryBytes, containers);

  return {
    key: projectSlug,
    title: normalizeProjectTitle(
      getStringAttribute(projectEntity, 'project') ??
        cleanupFriendlyName(projectEntity, 'CPU', '') ??
        cleanupFriendlyName(states[cpuEntityId ?? ''], 'CPU', '') ??
        projectSlug
          .split('_')
          .filter(Boolean)
          .map(capitalize)
          .join(' ')
    ),
    cpuPercent,
    memoryBytes: effectiveMemoryBytes,
    runningContainers: Math.round(runningContainers),
    totalContainers: Math.round(totalContainers),
    status: runningContainers <= 0 ? 'down' : runningContainers < totalContainers ? 'partial' : 'up',
    containers
  };
};

const normalizeProjectContainers = (projectSlug: string, containers: DockerContainer[]): DockerContainer[] => {
  if (projectSlug !== 'virtual_machines') {
    return containers;
  }

  return containers.map((container) =>
    container.running
      ? container
      : {
          ...container,
          memoryBytes: 0
        }
  );
};

const resolveProjectMemoryBytes = (projectSlug: string, memoryBytes: number, containers: DockerContainer[]): number => {
  if (projectSlug !== 'virtual_machines') {
    return memoryBytes;
  }
  if (containers.length === 0) {
    return memoryBytes;
  }

  return containers.reduce((total, container) => total + (container.running ? container.memoryBytes : 0), 0);
};

const collectProjectContainers = (
  states: Record<string, HassEntityLike>,
  projectSlug: string,
  projectEntityId?: string
): DockerContainer[] => {
  const projectContainers = getObjectArrayAttribute(states[projectEntityId ?? ''], 'containers');
  if (projectContainers.length > 0) {
    return projectContainers
      .map((item, index) => parseProjectContainerAttribute(item, projectSlug, index))
      .filter((container): container is DockerContainer => container !== null)
      .sort(
        (left, right) =>
          Number(right.running) - Number(left.running) ||
          right.cpuPercent - left.cpuPercent ||
          right.memoryBytes - left.memoryBytes ||
          left.name.localeCompare(right.name)
      );
  }

  const containersByKey = new Map<
    string,
    Partial<DockerContainer> & {
      key: string;
      projectSlug?: string;
    }
  >();

  for (const [entityId, entity] of getStateEntries(states)) {
    if (!isUsableEntityState(entity)) {
      continue;
    }

    const entityMatch = containerEntityRegex.exec(entityId) ?? vmEntityRegex.exec(entityId);
    const friendlyMetric = getFriendlyContainerMetric(entity);
    const metric = entityMatch?.[2] ?? friendlyMetric?.metric;
    const containerName = getStringAttribute(entity, 'container');
    const containerProject = normalizeProjectSlug(
      getStringAttribute(entity, 'project_slug') ?? getStringAttribute(entity, 'project')
    );
    const image = getStringAttribute(entity, 'image');
    const status = getStringAttribute(entity, 'status');
    const state = getStringAttribute(entity, 'state');
    const running = getBooleanAttribute(entity, 'running');
    const hasContainerPayload =
      Boolean(containerName) ||
      image !== undefined ||
      status !== undefined ||
      state !== undefined ||
      running !== undefined ||
      getNumberAttribute(entity, 'memory_current_bytes') !== undefined ||
      getNumberAttribute(entity, 'memory_limit_bytes') !== undefined ||
      metric !== undefined;
    if (!hasContainerPayload) {
      continue;
    }

    const containerKey =
      friendlyMetric?.key ??
      slugify(
        containerName ??
          getStringAttribute(entity, 'container_slug') ??
          getStringAttribute(entity, 'container_id') ??
          entityMatch?.[1] ??
          entityId
      );
    const container = containersByKey.get(containerKey) ?? { key: containerKey };

    container.projectSlug =
      containerProject ??
      container.projectSlug ??
      inferProjectSlugFromEntity(containerKey, entity, projectSlug);
    container.name =
      container.name ??
      containerName ??
      friendlyMetric?.name ??
      cleanupFriendlyName(entity, '', '') ??
      toDisplayName(containerKey);
    container.image = container.image ?? image ?? 'Unknown';
    container.status = container.status ?? status ?? 'Unavailable';
    container.state = container.state ?? state ?? (metric === 'running' ? inferContainerState(entity) : undefined);
    container.memoryCurrentBytes = container.memoryCurrentBytes ?? getNumberAttribute(entity, 'memory_current_bytes');
    container.memoryLimitBytes = container.memoryLimitBytes ?? getNumberAttribute(entity, 'memory_limit_bytes');
    container.cpuPercent =
      getNumberAttribute(entity, 'cpu_usage_percent') ??
      (metric === 'cpu_usage_percent' ? parseNumber(entity.state) : undefined) ??
      container.cpuPercent ??
      0;
    container.memoryBytes =
      getNumberAttribute(entity, 'memory_usage_bytes') ??
      (metric === 'memory_usage_bytes' ? parseNumber(entity.state) : undefined) ??
      container.memoryBytes ??
      0;
    container.running =
      running ??
      (metric === 'running' ? inferContainerRunning(entity, container.state) : undefined) ??
      container.running;

    containersByKey.set(containerKey, container);
  }

  return Array.from(containersByKey.values())
    .filter((container) =>
      container.projectSlug !== undefined
        ? container.projectSlug === projectSlug
        : matchesProjectContainerState(container, projectSlug)
    )
    .map((container) => ({
      key: container.key,
      name: container.name ?? toDisplayName(container.key),
      image: container.image ?? 'Unknown',
      status: container.status ?? 'Unavailable',
      state: container.state ?? 'unknown',
      running: container.running ?? false,
      cpuPercent: container.cpuPercent ?? 0,
      memoryBytes: container.memoryBytes ?? 0,
      memoryCurrentBytes: container.memoryCurrentBytes,
      memoryLimitBytes: container.memoryLimitBytes
    }))
    .sort(
      (left, right) =>
        Number(right.running) - Number(left.running) ||
        right.cpuPercent - left.cpuPercent ||
        right.memoryBytes - left.memoryBytes ||
        left.name.localeCompare(right.name)
    );
};

const parseProjectContainerAttribute = (
  item: Record<string, unknown>,
  projectSlug: string,
  index: number
): DockerContainer | null => {
  const containerProject = normalizeProjectSlug(readString(item, ['project_slug', 'project', 'ProjectSlug', 'Project']));
  if (containerProject !== undefined && containerProject !== projectSlug) {
    return null;
  }

  const name = readString(item, ['name', 'container', 'Name', 'Container']);
  const key =
    readString(item, ['container_slug', 'key', 'ContainerSlug', 'Key']) ??
    slugify(name ?? readString(item, ['container_id', 'ContainerID']) ?? `container_${index}`);

  return {
    key,
    name: name ?? toDisplayName(key),
    image: readString(item, ['image', 'Image']) ?? 'Unknown',
    status: readString(item, ['status', 'Status']) ?? 'Unavailable',
    state: readString(item, ['state', 'State']) ?? 'unknown',
    running:
      readBooleanRecord(item, ['running', 'Running']) ??
      readString(item, ['state', 'State'])?.toLowerCase() === 'running',
    cpuPercent: readNumber(item, ['cpu_usage_percent', 'cpuPercent', 'CPUUsagePercent', 'CPUPercent']) ?? 0,
    memoryBytes: readNumber(item, ['memory_usage_bytes', 'memoryBytes', 'MemoryUsageBytes', 'MemoryBytes']) ?? 0,
    memoryCurrentBytes: readNumber(item, ['memory_current_bytes', 'memoryCurrentBytes', 'MemoryCurrentBytes']),
    memoryLimitBytes: readNumber(item, ['memory_limit_bytes', 'memoryLimitBytes', 'MemoryLimitBytes'])
  };
};

const buildCpuCoreDetails = (
  states: Record<string, HassEntityLike>,
  hostCpuEntityId: string | undefined
): CpuCoreDetail[] => {
  const items: CpuCoreDetail[] = [];

  getObjectArrayAttribute(states[hostCpuEntityId ?? ''], 'cpu_cores').forEach((item, index) => {
      const name = readString(item, ['name']) ?? `cpu${index}`;
      const usagePercent = readNumber(item, ['usage_percent', 'UsagePercent']);
      if (usagePercent === undefined) {
        return;
      }

      items.push({
        key: slugify(name) || `cpu_${index}`,
        name: normalizeCpuCoreLabel(name),
        usagePercent,
        currentMHz: readNumber(item, ['current_mhz', 'CurrentMHz']),
        minMHz: readNumber(item, ['min_mhz', 'MinMHz']),
        maxMHz: readNumber(item, ['max_mhz', 'MaxMHz']),
        governor: readString(item, ['governor', 'Governor'])
      });
    });

  return items.sort(compareCpuCoreDetails);
};

const buildRamBreakdown = (
  states: Record<string, HassEntityLike>,
  hostMemoryEntityId: string | undefined,
  resolvedMemoryTotalBytes: number,
  resolvedMemoryUsedBytes: number
): RamBreakdownItem[] => {
  const memoryEntity = states[hostMemoryEntityId ?? ''];
  const totalBytes = getNumberAttribute(memoryEntity, 'memory_total_bytes') ?? resolvedMemoryTotalBytes;
  const usedBytes = getNumberAttribute(memoryEntity, 'memory_used_bytes') ?? resolvedMemoryUsedBytes;
  const buffersBytes = getNumberAttribute(memoryEntity, 'memory_buffers_bytes');
  const cachedBytes = getNumberAttribute(memoryEntity, 'memory_cached_bytes');
  const swapUsedBytes = getNumberAttribute(memoryEntity, 'swap_used_bytes');
  const swapTotalBytes = getNumberAttribute(memoryEntity, 'swap_total_bytes');

  return [
    { key: 'total', label: 'Total', valueBytes: totalBytes },
    { key: 'used', label: 'Used', valueBytes: usedBytes, totalBytes },
    ...(buffersBytes !== undefined ? [{ key: 'buffers', label: 'Buffers', valueBytes: buffersBytes, totalBytes }] : []),
    ...(cachedBytes !== undefined ? [{ key: 'cached', label: 'Cached', valueBytes: cachedBytes, totalBytes }] : []),
    ...(swapUsedBytes !== undefined ? [{ key: 'swap_used', label: 'Swap Used', valueBytes: swapUsedBytes, totalBytes: swapTotalBytes }] : []),
    ...(swapTotalBytes !== undefined ? [{ key: 'swap_total', label: 'Swap Total', valueBytes: swapTotalBytes }] : [])
  ];
};

const buildGpuEngineDetails = (
  states: Record<string, HassEntityLike>,
  gpuEntityIds: string[]
): GpuEngineDetail[] => {
  const itemsByKey = new Map<string, GpuEngineDetail>();

  for (const entityId of gpuEntityIds) {
    getObjectArrayAttribute(states[entityId], 'engines').forEach((item, index) => {
      const name = readString(item, ['name', 'Name']);
      const busyPercent = readNumber(item, ['busy_percent', 'BusyPercent']);
      if (!name || busyPercent === undefined) {
        return;
      }

      const key = slugify(name) || `engine_${index}`;
      const detail = {
        key,
        label: normalizeGpuEngineLabel(name),
        busyPercent,
        semaPercent: readNumber(item, ['sema_percent', 'SemaPercent']),
        waitPercent: readNumber(item, ['wait_percent', 'WaitPercent'])
      };
      const previous = itemsByKey.get(key);
      if (!previous || detail.busyPercent > previous.busyPercent) {
        itemsByKey.set(key, detail);
      }
    });
  }

  return Array.from(itemsByKey.values()).sort(
    (left, right) => right.busyPercent - left.busyPercent || left.label.localeCompare(right.label)
  );
};

const buildGpuStatDetails = (
  states: Record<string, HassEntityLike>,
  gpuEntityIds: string[]
): GpuStatDetail[] => {
  const itemsByKey = new Map<string, GpuStatDetail>();

  for (const entityId of gpuEntityIds) {
    getObjectArrayAttribute(states[entityId], 'stats').forEach((item, index) => {
      const value = readNumber(item, ['value', 'Value']);
      if (value === undefined) {
        return;
      }

      const key = readString(item, ['key', 'Key']) ?? `stat_${index}`;
      itemsByKey.set(key, {
        key,
        label: readString(item, ['label', 'Label']) ?? normalizeGpuStatLabel(key),
        value,
        unit: readString(item, ['unit', 'Unit'])
      });
    });
  }

  return Array.from(itemsByKey.values());
};

const buildTopProcesses = (states: Record<string, HassEntityLike>): ProcessDetail[] => {
  const processes = new Map<string, ProcessDetail>();

  for (const [entityId, entity] of getStateEntries(states)) {
    const entityMatch = processEntityRegex.exec(entityId);
    const metric = entityMatch?.[2];
    const stateValue = parseNumber(entity.state);
    const processName = getStringAttribute(entity, 'name');
    const processCount = getNumberAttribute(entity, 'process_count');
    const cpuTimeSeconds = getNumberAttribute(entity, 'cpu_time_seconds');
    const cpuPercent = getNumberAttribute(entity, 'cpu_usage_percent');
    const memoryBytes = getNumberAttribute(entity, 'memory_usage_bytes');
    const looksLikeProcessEntity =
      processCount !== undefined ||
      cpuTimeSeconds !== undefined ||
      (processName !== undefined &&
        getFriendlyNameLower(entity).includes('process') &&
        cpuPercent !== undefined &&
        memoryBytes !== undefined) ||
      entityMatch !== null;
    if (!looksLikeProcessEntity) {
      continue;
    }

    const processKey = slugify(processName ?? entityMatch?.[1] ?? entityId);
    const current = processes.get(processKey) ?? {
      key: processKey,
      name: processName ?? cleanupFriendlyName(entity, '', '') ?? toDisplayName(entityMatch?.[1] ?? processKey),
      processCount: 0,
      cpuPercent: 0,
      memoryBytes: 0
    };

    current.name = processName ?? current.name;
    current.processCount = Math.round(
      processCount ?? (metric === 'process_count' ? stateValue : undefined) ?? current.processCount
    );
    current.cpuPercent =
      cpuPercent ?? (metric === 'cpu_usage_percent' ? stateValue : undefined) ?? current.cpuPercent;
    current.memoryBytes =
      memoryBytes ?? (metric === 'memory_usage_bytes' ? stateValue : undefined) ?? current.memoryBytes;
    current.cpuTimeSeconds =
      cpuTimeSeconds ?? (metric === 'cpu_time_seconds' ? stateValue : undefined) ?? current.cpuTimeSeconds;

    processes.set(processKey, current);
  }

  return Array.from(processes.values())
    .sort(
      (left, right) =>
        right.cpuPercent - left.cpuPercent ||
        right.memoryBytes - left.memoryBytes ||
        right.processCount - left.processCount ||
        left.name.localeCompare(right.name)
    )
    .slice(0, 10);
};

const mapArrayMembersToDriveSlugs = (members: string[], drives: DriveInfo[]): string[] => {
  if (members.length === 0) {
    return [];
  }

  const driveAliases = new Map<string, string>();
  drives
    .filter((drive) => Boolean(drive.diskSlug))
    .forEach((drive) => {
      const driveSlug = drive.diskSlug as string;
      for (const alias of [driveSlug, drive.deviceName ?? ''].flatMap(normalizeBlockDeviceCandidates)) {
        driveAliases.set(alias, driveSlug);
      }
    });

  return Array.from(
    new Set(
      members
        .flatMap((member) => normalizeBlockDeviceCandidates(member))
        .map((memberSlug) => driveAliases.get(memberSlug))
        .filter((driveSlug): driveSlug is string => Boolean(driveSlug))
    )
  );
};

const buildNetworkInterface = (
  states: Record<string, HassEntityLike>,
  hostSlug: string,
  networkSlug: string,
  temperatures: TemperatureSnapshot[]
): NetworkInterfaceInfo | null => {
  const rxEntityId = resolveNetworkMetricEntityId(states, hostSlug, networkSlug, 'rx');
  const txEntityId = resolveNetworkMetricEntityId(states, hostSlug, networkSlug, 'tx');
  const rxBytesPerSecond = getNumberState(states, rxEntityId);
  const txBytesPerSecond = getNumberState(states, txEntityId);
  const linkSpeedMbps = getNumberState(states, resolveNetworkMetricEntityId(states, hostSlug, networkSlug, 'speed'));
  const carrierEntityId = resolveNetworkCarrierEntityId(states, hostSlug, networkSlug);
  if (rxBytesPerSecond === undefined && txBytesPerSecond === undefined && linkSpeedMbps === undefined && !carrierEntityId) {
    return null;
  }

  return {
    name: normalizeInterfaceName(networkSlug),
    status: isBinaryOn(states[carrierEntityId ?? '']) ? 'up' : 'down',
    linkSpeedMbps: linkSpeedMbps ?? undefined,
    temperatureCelsius: pickInterfaceTemperature(temperatures, networkSlug),
    downloadBps: (rxBytesPerSecond ?? 0) * 8,
    uploadBps: (txBytesPerSecond ?? 0) * 8
  };
};

const buildBondInterface = (
  states: Record<string, HassEntityLike>,
  hostSlug: string,
  bondSlug: string,
  temperatures: TemperatureSnapshot[]
): NetworkInterfaceInfo | null => {
  const speedEntityId = resolveBondMetricEntityId(states, hostSlug, bondSlug, 'speed');
  const speedMbps = getNumberState(states, speedEntityId);
  const carrierEntityId = resolveBondCarrierEntityId(states, hostSlug, bondSlug);
  const totalBps = resolveInterfaceTotalBps(states, hostSlug, bondSlug);

  if (speedMbps === undefined && !carrierEntityId) {
    return null;
  }

  return {
    name: normalizeInterfaceName(bondSlug),
    status: isBinaryOn(states[carrierEntityId ?? '']) ? 'up' : 'down',
    linkSpeedMbps: speedMbps ?? undefined,
    temperatureCelsius: pickInterfaceTemperature(temperatures, bondSlug),
    downloadBps: totalBps / 2,
    uploadBps: totalBps / 2
  };
};

const collectFilesystems = (states: Record<string, HassEntityLike>, hostSlug: string): FilesystemSnapshot[] => {
  const filesystemSlugs = collectFilesystemSlugs(states, hostSlug);

  return filesystemSlugs
    .map((filesystemSlug) => {
      const usedEntityId = resolveFilesystemMetricEntityId(states, hostSlug, filesystemSlug, 'used');
      const freeEntityId = resolveFilesystemMetricEntityId(states, hostSlug, filesystemSlug, 'free');
      const usedBytes = getNumberState(states, usedEntityId);
      const freeBytes = getNumberState(states, freeEntityId);
      if (usedBytes === undefined || freeBytes === undefined) {
        return null;
      }

      return {
        slug: filesystemSlug,
        name: cleanupFriendlyName(states[usedEntityId ?? ''], 'Used', '') ?? filesystemNameFromSlug(filesystemSlug),
        usedBytes,
        freeBytes,
        totalBytes: usedBytes + freeBytes,
        readOnly: isBinaryOn(states[resolveFilesystemReadonlyEntityId(states, hostSlug, filesystemSlug) ?? ''])
      };
    })
    .filter((filesystem): filesystem is FilesystemSnapshot => filesystem !== null)
    .sort((left, right) => left.name.localeCompare(right.name));
};

const collectArrays = (states: Record<string, HassEntityLike>, hostSlug: string): ArraySnapshot[] => {
  const arraySlugs = collectArraySlugs(states, hostSlug);
  const arrays: ArraySnapshot[] = [];

  for (const arraySlug of arraySlugs) {
    const sizeEntityId = resolveArrayMetricEntityId(states, hostSlug, arraySlug, 'size');
    const sizeBytes = getNumberState(states, sizeEntityId);
    const degradedDisks = getNumberState(states, resolveArrayMetricEntityId(states, hostSlug, arraySlug, 'degraded')) ?? 0;
    const activeDisks = getNumberState(states, resolveArrayMetricEntityId(states, hostSlug, arraySlug, 'active'));
    const totalDisks = getNumberState(states, resolveArrayMetricEntityId(states, hostSlug, arraySlug, 'total'));
    const syncPercent = getNumberState(states, resolveArrayMetricEntityId(states, hostSlug, arraySlug, 'sync'));
    const levelEntityId = resolveArrayTextMetricEntityId(states, hostSlug, arraySlug, 'level');
    const level = getTextState(states, levelEntityId);
    if (sizeBytes === undefined && activeDisks === undefined && totalDisks === undefined && syncPercent === undefined && level === undefined) {
      continue;
    }

    const members = getFirstStringArrayAttribute(
      [
        states[sizeEntityId ?? ''],
        states[levelEntityId ?? ''],
        states[resolveArrayMetricEntityId(states, hostSlug, arraySlug, 'active') ?? ''],
        states[resolveArrayMetricEntityId(states, hostSlug, arraySlug, 'total') ?? ''],
        states[resolveArrayMetricEntityId(states, hostSlug, arraySlug, 'degraded') ?? '']
      ],
      'members'
    );

    arrays.push({
      slug: arraySlug,
      name:
        cleanupFriendlyName(states[sizeEntityId ?? ''], 'Size', '') ??
        cleanupFriendlyName(states[levelEntityId ?? ''], 'Level', '') ??
        arraySlug.toUpperCase(),
      sizeBytes: sizeBytes ?? 0,
      degradedDisks: Math.round(degradedDisks),
      activeDisks: activeDisks !== undefined ? Math.round(activeDisks) : undefined,
      totalDisks: totalDisks !== undefined ? Math.round(totalDisks) : undefined,
      syncPercent,
      level,
      members
    });
  }

  return arrays.sort((left, right) => left.name.localeCompare(right.name));
};

const getHostRootSensorEntries = (
  states: Record<string, HassEntityLike>,
  hostSlug: string
): Array<[string, HassEntityLike]> =>
  getComputedResult(states, `hostRootEntries:${hostSlug}`, () =>
    getStateEntries(states).filter(([entityId]) => isHostRootSensorEntity(entityId, hostSlug))
  );

const collectTemperatureSnapshots = (states: Record<string, HassEntityLike>, hostSlug: string): TemperatureSnapshot[] => {
  return getComputedResult(states, `temperatures:${hostSlug}`, () => {
    const entityPrefixes = [
      `sensor.ugos_bridge_host_${hostSlug}_`,
      `sensor.${hostSlug}_`,
      'sensor.ugos_bridge_disk_',
      'sensor.ugos_bridge_gpu_'
    ];

    return getStateEntries(states)
      .filter(
        ([entityId, entity]) =>
          entityId.startsWith('sensor.') &&
          entityPrefixes.some((prefix) => entityId.startsWith(prefix)) &&
          (entityId.endsWith('_temperature_celsius') || includesFriendlyText(entity, ['temperature']))
      )
      .map(([entityId, entity]) => {
        const value = parseNumber(entity.state);
        if (value === undefined) {
          return null;
        }

        return {
          entityId,
          label: `${getFriendlyName(entity)} ${entityId}`.trim().toLowerCase(),
          value
        };
      })
      .filter((temperature): temperature is TemperatureSnapshot => temperature !== null);
  });
};

const resolveHostSlug = (states: Record<string, HassEntityLike>, configuredHost: string | undefined): string | null => {
  return getComputedResult(states, `hostSlug:${configuredHost ?? ''}`, () => {
    if (configuredHost) {
      const preferredSlug = normalizeConfiguredHostSlug(configuredHost);
      if (hasEntityPrefix(states, preferredSlug) || hasBridgeHostEntityPrefix(states, preferredSlug)) {
        return preferredSlug;
      }
    }

    const hostSlugs = collectHostSlugCandidates(states);
    if (hostSlugs.length === 0) {
      return null;
    }

    if (!configuredHost) {
      return hostSlugs[0];
    }

    const preferredSlug = normalizeConfiguredHostSlug(configuredHost);
    return hostSlugs.find((slug) => slug === preferredSlug) ?? hostSlugs[0];
  });
};

const normalizeConfiguredHostSlug = (configuredHost: string): string => {
  let slug = slugify(configuredHost);
  for (const prefix of ['sensor_', 'binary_sensor_']) {
    if (slug.startsWith(prefix)) {
      slug = slug.slice(prefix.length);
      break;
    }
  }

  if (slug.startsWith('ugos_bridge_host_')) {
    slug = slug.slice('ugos_bridge_host_'.length);
  }

  const metricSuffixes = [
    '_cpu_usage_percent',
    '_cpu_frequency_mhz',
    '_load_1',
    '_memory_used_bytes',
    '_memory_used_percent',
    '_swap_used_percent',
    '_uptime_seconds'
  ];
  for (const suffix of metricSuffixes) {
    if (slug.endsWith(suffix)) {
      return slug.slice(0, -suffix.length);
    }
  }

  return slug;
};

const resolveHostDisplayName = (
  states: Record<string, HassEntityLike>,
  hostSlug: string,
  configuredHost: string | undefined
): string =>
  cleanupFriendlyName(states[resolveHostMetricEntityId(states, hostSlug, 'cpu') ?? ''], 'CPU', '') ??
  configuredHost?.trim() ??
  toDisplayName(hostSlug);

const resolveIPAddress = (states: Record<string, HassEntityLike>, config: CardConfig | undefined): string => {
  if (config?.ipEntity) {
    const value = states[config.ipEntity]?.state;
    if (value && value !== 'unknown' && value !== 'unavailable') {
      return value;
    }
  }

  return config?.ipAddress?.trim() || 'Unavailable';
};

const resolveMemoryTotalBytes = (usedBytes: number, usedPercent: number, configuredTotalBytes: number | undefined): number => {
  if (configuredTotalBytes && configuredTotalBytes > 0) {
    return configuredTotalBytes;
  }
  if (usedPercent > 0) {
    return Math.max(usedBytes, Math.round(usedBytes / (usedPercent / 100)));
  }
  return usedBytes;
};

const selectFilesystems = (filesystems: FilesystemSnapshot[], configuredFilesystems: string[] | undefined): FilesystemSnapshot[] => {
  if (configuredFilesystems && configuredFilesystems.length > 0) {
    const selected = filesystems.filter((filesystem) => matchesSelector(filesystem.slug, filesystem.name, configuredFilesystems));
    if (selected.length > 0) {
      return selected;
    }
  }

  const nonRootFilesystems = filesystems.filter((filesystem) => filesystem.name !== '/');
  return nonRootFilesystems.length > 0 ? nonRootFilesystems : filesystems;
};

const selectSlugs = (slugs: string[], configuredSelections: string[] | undefined): string[] => {
  if (!configuredSelections || configuredSelections.length === 0) {
    return slugs.filter((slug) => slug !== 'lo');
  }

  const normalizedSelections = configuredSelections.map((value) => slugify(value));
  const selected = slugs.filter((slug) => normalizedSelections.includes(slugify(slug)));
  return selected.length > 0 ? selected : slugs;
};

const collectProjectSlugs = (states: Record<string, HassEntityLike>): string[] => {
  return getComputedResult(states, 'projectSlugs', () => {
    const exactSlugs = getStateKeys(states)
      .map((entityId) => projectCpuRegex.exec(entityId)?.[1])
      .filter((slug): slug is string => Boolean(slug));

    const legacySlugs = getEntriesByPrefix(states, 'sensor.compose_project_')
      .map(([, entity]) => getFriendlyProjectSlug(entity))
      .filter((slug): slug is string => Boolean(slug));

    const attributeSlugs = getStateEntries(states)
      .filter(
        ([entityId, entity]) =>
          entityId.startsWith('sensor.') &&
          (getStringAttribute(entity, 'project_slug') !== undefined || getStringAttribute(entity, 'project') !== undefined)
      )
      .map(([, entity]) => normalizeProjectSlug(getStringAttribute(entity, 'project_slug') ?? getStringAttribute(entity, 'project')))
      .filter((slug): slug is string => Boolean(slug));

    return Array.from(new Set([...exactSlugs, ...legacySlugs, ...attributeSlugs])).sort();
  });
};

const collectDiskSlugs = (states: Record<string, HassEntityLike>, hostSlug: string, hostPrefix: string): string[] => {
  return getComputedResult(states, `diskSlugs:${hostSlug}:${hostPrefix}`, () => {
    const componentSlugs = collectComponentEntitySlugs(states, hostSlug, hostPrefix, 'disk', isLikelyDiskSlug);
    const exactSlugs = [
      ...collectEntitySlugs(states, new RegExp(`^sensor\\.${escapeRegExp(hostPrefix)}_disk_(.+?)_size_bytes$`)),
      ...collectEntitySlugs(states, /^sensor\.ugos_bridge_disk_(.+?)_size_bytes$/),
      ...collectEntitySlugs(
        states,
        new RegExp(
          `^sensor\\.${escapeRegExp(hostPrefix)}_disk_(.+?)_(?:size_bytes|read_bytes_per_second|write_bytes_per_second|busy_percent|model|vendor|serial|media_type)(?:_\\d+)?$`
        )
      )
    ];
    const discoveredSlugs = Array.from(new Set([...componentSlugs, ...exactSlugs])).sort();
    if (discoveredSlugs.length > 0) {
      return discoveredSlugs;
    }
    const legacySlugs = getStateKeys(states)
      .map((entityId) => entityId.match(new RegExp(`^sensor\\.${escapeRegExp(hostSlug)}_disk_([^_]+)_`))?.[1])
      .filter((slug): slug is string => Boolean(slug));
    const friendlySlugs = getStateValues(states)
      .map((entity) => extractFriendlyMetricSlug(entity, hostSlug, ['Size', 'Busy', 'Read Throughput', 'Write Throughput']))
      .filter((slug): slug is string => slug !== undefined && isLikelyDiskSlug(slug));
    const payloadSlugs = getStateValues(states)
      .filter(
        (entity) =>
          getNumberAttribute(entity, 'size_bytes') !== undefined ||
          getNumberAttribute(entity, 'read_bytes_per_second') !== undefined ||
          getNumberAttribute(entity, 'write_bytes_per_second') !== undefined
      )
      .map((entity) => slugify(getStringAttribute(entity, 'name') ?? ''))
      .filter((slug): slug is string => isLikelyDiskSlug(slug));

    return Array.from(new Set([...componentSlugs, ...exactSlugs, ...legacySlugs, ...friendlySlugs, ...payloadSlugs])).sort();
  });
};

const collectFilesystemSlugs = (states: Record<string, HassEntityLike>, hostSlug: string): string[] => {
  return getComputedResult(states, `filesystemSlugs:${hostSlug}`, () => {
    const hostPrefix = `ugos_bridge_host_${hostSlug}`;
    const componentSlugs = collectComponentEntitySlugs(states, hostSlug, hostPrefix, 'filesystem', (slug) => Boolean(slug));
    const exactSlugs = [
      ...collectEntitySlugs(states, new RegExp(`^sensor\\.ugos_bridge_host_${escapeRegExp(hostSlug)}_filesystem_(.+?)_used_bytes$`)),
      ...collectEntitySlugs(states, /^sensor\.ugos_bridge_filesystem_(.+?)_used_bytes$/),
      ...collectEntitySlugs(
        states,
        new RegExp(
          `^(?:sensor|binary_sensor)\\.ugos_bridge_host_${escapeRegExp(hostSlug)}_filesystem_(.+?)_(?:used_bytes|free_bytes|used_percent|read_only)(?:_\\d+)?$`
        )
      )
    ];
    const legacySlugs = getStateKeys(states)
      .map((entityId) => entityId.match(new RegExp(`^sensor\\.${escapeRegExp(hostSlug)}_filesystem_([^_]+)_`))?.[1])
      .filter((slug): slug is string => Boolean(slug));
    const friendlySlugs = getStateValues(states)
      .map((entity) => getFriendlyFilesystemSlug(entity, hostSlug))
      .filter((slug): slug is string => Boolean(slug));
    const payloadSlugs = getStateValues(states)
      .filter((entity) => getNumberAttribute(entity, 'used_bytes') !== undefined || getNumberAttribute(entity, 'free_bytes') !== undefined)
      .map((entity) => slugify(getStringAttribute(entity, 'name') ?? ''))
      .filter((slug): slug is string => Boolean(slug));

    return Array.from(new Set([...componentSlugs, ...exactSlugs, ...legacySlugs, ...friendlySlugs, ...payloadSlugs])).sort();
  });
};

const collectNetworkSlugs = (states: Record<string, HassEntityLike>, hostSlug: string, hostPrefix: string): string[] => {
  return getComputedResult(states, `networkSlugs:${hostSlug}:${hostPrefix}`, () => {
    const componentSlugs = collectComponentEntitySlugs(states, hostSlug, hostPrefix, 'network', isLikelyNetworkSlug);
    const exactSlugs = [
      ...collectEntitySlugs(states, new RegExp(`^sensor\\.${escapeRegExp(hostPrefix)}_network_(.+?)_rx_bytes_per_second$`)),
      ...collectEntitySlugs(states, /^sensor\.ugos_bridge_network_(.+?)_rx_bytes_per_second$/),
      ...collectEntitySlugs(
        states,
        new RegExp(
          `^(?:sensor|binary_sensor)\\.${escapeRegExp(hostPrefix)}_network_(.+?)_(?:rx_bytes_per_second|tx_bytes_per_second|speed_mbps|carrier)(?:_\\d+)?$`
        )
      )
    ];
    const legacySlugs = getStateKeys(states)
      .map((entityId) => entityId.match(new RegExp(`^sensor\\.${escapeRegExp(hostSlug)}_network_([^_]+)_`))?.[1])
      .filter((slug): slug is string => Boolean(slug));
    const friendlySlugs = getStateValues(states)
      .map((entity) => extractFriendlyMetricSlug(entity, hostSlug, ['RX Throughput', 'TX Throughput', 'Link Speed', 'Carrier']))
      .filter((slug): slug is string => slug !== undefined && isLikelyNetworkSlug(slug));
    const payloadSlugs = getStateValues(states)
      .filter(
        (entity) =>
          getNumberAttribute(entity, 'rx_bytes_per_second') !== undefined ||
          getNumberAttribute(entity, 'tx_bytes_per_second') !== undefined ||
          getNumberAttribute(entity, 'speed_mbps') !== undefined
      )
      .map((entity) => slugify(getStringAttribute(entity, 'name') ?? ''))
      .filter((slug): slug is string => isLikelyNetworkSlug(slug));

    return Array.from(new Set([...componentSlugs, ...exactSlugs, ...legacySlugs, ...friendlySlugs, ...payloadSlugs])).sort();
  });
};

const collectBondSlugs = (states: Record<string, HassEntityLike>, hostSlug: string, hostPrefix: string): string[] => {
  return getComputedResult(states, `bondSlugs:${hostSlug}:${hostPrefix}`, () => {
    const componentSlugs = collectComponentEntitySlugs(states, hostSlug, hostPrefix, 'bond', isLikelyBondSlug);
    const exactSlugs = [
      ...collectEntitySlugs(states, new RegExp(`^sensor\\.${escapeRegExp(hostPrefix)}_bond_(.+?)_speed_mbps$`)),
      ...collectEntitySlugs(states, /^sensor\.ugos_bridge_bond_(.+?)_speed_mbps$/),
      ...collectEntitySlugs(
        states,
        new RegExp(
          `^(?:sensor|binary_sensor)\\.${escapeRegExp(hostPrefix)}_bond_(.+?)_(?:speed_mbps|mode|active_slave|mii_status|slave_count|carrier)(?:_\\d+)?$`
        )
      )
    ];
    const legacySlugs = getStateKeys(states)
      .map((entityId) => entityId.match(new RegExp(`^sensor\\.${escapeRegExp(hostSlug)}_bond_([^_]+)_`))?.[1])
      .filter((slug): slug is string => Boolean(slug));
    const friendlySlugs = getStateValues(states)
      .map((entity) => extractFriendlyMetricSlug(entity, hostSlug, ['Link Speed', 'Mode', 'Active Slave', 'MII Status', 'Slave Count', 'Carrier']))
      .filter((slug): slug is string => slug !== undefined && isLikelyBondSlug(slug));
    const payloadSlugs = getStateValues(states)
      .filter(
        (entity) =>
          getStringAttribute(entity, 'mode') !== undefined ||
          getStringAttribute(entity, 'active_slave') !== undefined ||
          getNumberAttribute(entity, 'speed_mbps') !== undefined
      )
      .map((entity) => slugify(getStringAttribute(entity, 'name') ?? ''))
      .filter((slug): slug is string => isLikelyBondSlug(slug));

    return Array.from(new Set([...componentSlugs, ...exactSlugs, ...legacySlugs, ...friendlySlugs, ...payloadSlugs])).sort();
  });
};

const preferPrimaryNetworkSlugs = (slugs: string[], configuredSelections: string[] | undefined): string[] => {
  if (configuredSelections && configuredSelections.length > 0) {
    return slugs;
  }

  const preferred = slugs.filter((slug) => /^(bond\d+|eth\d+)$/i.test(slug));
  return preferred.length > 0 ? preferred : slugs;
};

const prioritizeTrafficLineSlugs = (slugs: string[]): string[] =>
  [...slugs]
    .filter((slug) => /^(bond\d+|eth\d+)$/i.test(slug))
    .sort((left, right) => networkSortOrder(left) - networkSortOrder(right) || left.localeCompare(right))
    .slice(0, 3);

const networkSortOrder = (slug: string): number => {
  const normalized = slug.toLowerCase();
  if (normalized.startsWith('bond')) {
    return 0;
  }
  if (normalized.startsWith('eth')) {
    return 1;
  }
  return 2;
};

const resolveInterfaceTotalBps = (
  states: Record<string, HassEntityLike>,
  hostSlug: string,
  interfaceSlug: string
): number => {
  const rxBytesPerSecond = getNumberState(states, resolveNetworkMetricEntityId(states, hostSlug, interfaceSlug, 'rx'));
  const txBytesPerSecond = getNumberState(states, resolveNetworkMetricEntityId(states, hostSlug, interfaceSlug, 'tx'));
  return ((rxBytesPerSecond ?? 0) + (txBytesPerSecond ?? 0)) * 8;
};

const trafficLineColor = (slug: string, index: number): string => {
  const normalized = slug.toLowerCase();
  if (normalized.startsWith('bond')) {
    return THEME_COLORS.cyan;
  }
  if (normalized === 'eth0') {
    return THEME_COLORS.good;
  }
  if (normalized === 'eth1') {
    return THEME_COLORS.purple;
  }
  return [THEME_COLORS.softBlue, THEME_COLORS.green, THEME_COLORS.blue][index % 3];
};

const collectGpuSlugs = (states: Record<string, HassEntityLike>, hostSlug: string, hostPrefix: string): string[] => {
  return getComputedResult(states, `gpuSlugs:${hostSlug}:${hostPrefix}`, () => {
    const componentSlugs = collectComponentEntitySlugs(states, hostSlug, hostPrefix, 'gpu', (slug) => Boolean(slug));
    const exactSlugs = [
      ...collectEntitySlugs(
        states,
        new RegExp(`^sensor\\.${escapeRegExp(hostPrefix)}_gpu_(.+?)_(?:busy_percent|busy|current_mhz|current_frequency|max_mhz|max_frequency)(?:_\\d+)?$`)
      ),
      ...collectEntitySlugs(states, /^sensor\.ugos_bridge_gpu_(.+?)_(?:busy_percent|busy|current_mhz|current_frequency|max_mhz|max_frequency)(?:_\d+)?$/)
    ];
    const legacySlugs = getStateKeys(states)
      .map((entityId) =>
        entityId.match(new RegExp(`^sensor\\.${escapeRegExp(hostSlug)}_gpu_([^_]+)_`))?.[1]
      )
      .filter((slug): slug is string => Boolean(slug));
    const payloadSlugs = getStateValues(states)
      .filter(
        (entity) =>
          getObjectArrayAttribute(entity, 'engines').length > 0 ||
          getObjectArrayAttribute(entity, 'stats').length > 0 ||
          getNumberAttribute(entity, 'busy_percent') !== undefined ||
          getNumberAttribute(entity, 'current_mhz') !== undefined
      )
      .map((entity) => slugify(getStringAttribute(entity, 'name') ?? ''))
      .filter((slug): slug is string => Boolean(slug));

    return Array.from(new Set([...componentSlugs, ...exactSlugs, ...legacySlugs, ...payloadSlugs])).sort();
  });
};

const collectArraySlugs = (states: Record<string, HassEntityLike>, hostSlug: string): string[] => {
  return getComputedResult(states, `arraySlugs:${hostSlug}`, () => {
    const hostPrefix = `ugos_bridge_host_${hostSlug}`;
    const componentSlugs = collectComponentEntitySlugs(states, hostSlug, hostPrefix, 'array', isLikelyArraySlug);
    const exactSlugs = [
      ...collectEntitySlugs(states, new RegExp(`^sensor\\.ugos_bridge_host_${escapeRegExp(hostSlug)}_array_(.+?)_size_bytes$`)),
      ...collectEntitySlugs(states, /^sensor\.ugos_bridge_array_(.+?)_size_bytes$/),
      ...collectEntitySlugs(
        states,
        new RegExp(
          `^(?:sensor|binary_sensor)\\.ugos_bridge_host_${escapeRegExp(hostSlug)}_array_(.+?)_(?:size_bytes|degraded_disks|active_disks|total_disks|sync_completed_percent|level|degraded)(?:_\\d+)?$`
        )
      )
    ];
    const legacySlugs = getStateKeys(states)
      .map((entityId) => entityId.match(new RegExp(`^sensor\\.${escapeRegExp(hostSlug)}_array_([^_]+)_`))?.[1])
      .filter((slug): slug is string => Boolean(slug));
    const friendlySlugs = getStateValues(states)
      .map((entity) => extractFriendlyMetricSlug(entity, hostSlug, ['Size', 'Degraded Disks', 'Sync Progress']))
      .filter((slug): slug is string => slug !== undefined && isLikelyArraySlug(slug));
    const payloadSlugs = getStateValues(states)
      .filter(
        (entity) =>
          getNumberAttribute(entity, 'size_bytes') !== undefined ||
          getStringAttribute(entity, 'level') !== undefined ||
          getNumberAttribute(entity, 'degraded_disks') !== undefined
      )
      .map((entity) => slugify(getStringAttribute(entity, 'name') ?? ''))
      .filter((slug): slug is string => isLikelyArraySlug(slug));

    return Array.from(new Set([...componentSlugs, ...exactSlugs, ...legacySlugs, ...friendlySlugs, ...payloadSlugs])).sort();
  });
};

const resolveHostMetricEntityId = (
  states: Record<string, HassEntityLike>,
  hostSlug: string,
  metric: HostMetric
): string | undefined => {
  return resolveCachedEntityId(states, `hostMetric:${hostSlug}:${metric}`, () => {
    const exactMap: Record<typeof metric, string> = {
      cpu: `sensor.ugos_bridge_host_${hostSlug}_cpu_usage_percent`,
      load1: `sensor.ugos_bridge_host_${hostSlug}_load_1`,
      cpufreq: `sensor.ugos_bridge_host_${hostSlug}_cpu_frequency_mhz`,
      memoryUsedBytes: `sensor.ugos_bridge_host_${hostSlug}_memory_used_bytes`,
      memoryUsedPercent: `sensor.ugos_bridge_host_${hostSlug}_memory_used_percent`,
      swapUsedPercent: `sensor.ugos_bridge_host_${hostSlug}_swap_used_percent`,
      uptime: `sensor.ugos_bridge_host_${hostSlug}_uptime_seconds`
    };

    if (states[exactMap[metric]]) {
      return exactMap[metric];
    }

    const entries = getHostRootSensorEntries(states, hostSlug);
    switch (metric) {
      case 'cpu':
        return findBestEntityId(entries, { entityIncludes: ['_cpu'], friendlyIncludes: ['cpu'], unit: '%' });
      case 'load1':
        return findBestEntityId(entries, { entityIncludes: ['load'], friendlyIncludes: ['load', '1'], unit: undefined });
      case 'cpufreq':
        return findBestEntityId(entries, { entityIncludes: ['frequency'], friendlyIncludes: ['frequency'], unit: 'MHz' });
      case 'memoryUsedBytes':
        return findBestEntityId(entries, { entityIncludes: ['memory'], friendlyIncludes: ['memory', 'used'], unit: 'B' });
      case 'memoryUsedPercent':
        return findBestEntityId(entries, { entityIncludes: ['memory'], friendlyIncludes: ['memory', 'used'], unit: '%' });
      case 'swapUsedPercent':
        return findBestEntityId(entries, { entityIncludes: ['swap'], friendlyIncludes: ['swap', 'used'], unit: '%' });
      case 'uptime':
        return findBestEntityId(entries, { entityIncludes: ['uptime'], friendlyIncludes: ['uptime'], unit: 's' });
    }
  });
};

const getHostMetricValue = (
  states: Record<string, HassEntityLike>,
  hostSlug: string,
  metric: HostMetric
): number | undefined => {
  const entityId = resolveHostMetricEntityId(states, hostSlug, metric);
  const attributeKey = hostMetricAttributeKeys[metric];
  const attributeCandidates = [
    entityId ? states[entityId] : undefined,
    states[resolveHostMetricEntityId(states, hostSlug, 'cpu') ?? ''],
    states[resolveHostMetricEntityId(states, hostSlug, 'memoryUsedBytes') ?? '']
  ];

  for (const entity of attributeCandidates) {
    const value = getNumberAttribute(entity, attributeKey);
    if (isPlausibleHostMetricValue(states, hostSlug, metric, value)) {
      return value;
    }
  }

  for (const [, entity] of getHostRootSensorEntries(states, hostSlug)) {
    const value = getNumberAttribute(entity, attributeKey);
    if (isPlausibleHostMetricValue(states, hostSlug, metric, value)) {
      return value;
    }
  }

  const stateValue = getNumberState(states, entityId);
  return isPlausibleHostMetricValue(states, hostSlug, metric, stateValue) ? stateValue : undefined;
};

const getHostLoadMetric = (states: Record<string, HassEntityLike>, hostSlug: string): HostLoadMetric => {
  const entityId = resolveHostMetricEntityId(states, hostSlug, 'load1');
  const entity = states[entityId ?? ''];
  const value = getHostMetricValue(states, hostSlug, 'load1') ?? 0;
  const isPercent = getUnit(entity) === '%' || isBridgeHostLoadEntity(entityId, entity);
  const valuePercent = isPercent ? value : value * 100;

  return {
    value,
    valuePercent: clampPercent(valuePercent),
    valueText: isPercent ? formatLoadPercent(value) : value.toFixed(2),
    unit: isPercent ? 'percent' : 'load',
    statusText: isPercent ? loadPercentLabel(valuePercent) : loadLabel(value)
  };
};

const isBridgeHostLoadEntity = (entityId: string | undefined, entity: HassEntityLike | undefined): boolean => {
  const entityText = entityId?.toLowerCase() ?? '';
  const friendlyText = getFriendlyNameLower(entity);
  return (
    entityText.endsWith('_load_1') ||
    entityText.includes('_load_1m') ||
    friendlyText.includes('load 1m') ||
    friendlyText.includes('load (1m)')
  );
};

const isPlausibleHostMetricValue = (
  states: Record<string, HassEntityLike>,
  hostSlug: string,
  metric: HostMetric,
  value: number | undefined
): value is number => {
  if (value === undefined || !Number.isFinite(value) || value < 0) {
    return false;
  }

  if (metric !== 'load1') {
    return true;
  }

  const cpuEntity = states[resolveHostMetricEntityId(states, hostSlug, 'cpu') ?? ''];
  const coreCount = getObjectArrayAttribute(cpuEntity, 'cpu_cores').length;
  const maxExpectedLoad = Math.max(coreCount * 64, 1024);
  return value <= maxExpectedLoad;
};

const resolveDiskMetricEntityId = (
  states: Record<string, HassEntityLike>,
  hostSlug: string,
  diskSlug: string,
  metric: 'size' | 'temperature' | 'read' | 'write' | 'busy'
): string | undefined => {
  return resolveCachedEntityId(states, `diskMetric:${hostSlug}:${diskSlug}:${metric}`, () => {
    const exactMap = {
      size: [`sensor.ugos_bridge_host_${hostSlug}_disk_${diskSlug}_size_bytes`, `sensor.ugos_bridge_disk_${diskSlug}_size_bytes`],
      temperature: [
        `sensor.ugos_bridge_host_${hostSlug}_disk_${diskSlug}_temperature_celsius`,
        `sensor.ugos_bridge_disk_${diskSlug}_temperature_celsius`
      ],
      read: [
        `sensor.ugos_bridge_host_${hostSlug}_disk_${diskSlug}_read_bytes_per_second`,
        `sensor.ugos_bridge_disk_${diskSlug}_read_bytes_per_second`
      ],
      write: [
        `sensor.ugos_bridge_host_${hostSlug}_disk_${diskSlug}_write_bytes_per_second`,
        `sensor.ugos_bridge_disk_${diskSlug}_write_bytes_per_second`
      ],
      busy: [`sensor.ugos_bridge_host_${hostSlug}_disk_${diskSlug}_busy_percent`, `sensor.ugos_bridge_disk_${diskSlug}_busy_percent`]
    };

    const exactEntityId = firstExistingEntityId(states, exactMap[metric]);
    if (exactEntityId) {
      return exactEntityId;
    }

    const prefixes = [
      `sensor.ugos_bridge_host_${hostSlug}_disk_${diskSlug}_`,
      `sensor.${hostSlug}_disk_${diskSlug}_`,
      `sensor.ugos_bridge_disk_${diskSlug}_`
    ];
    const prefixedEntries = getEntriesByPrefixes(states, prefixes);
    const matcher =
      metric === 'size'
        ? { entityIncludes: ['size'], friendlyIncludes: ['size'], unit: 'B' }
        : metric === 'temperature'
          ? { entityIncludes: ['temperature'], friendlyIncludes: ['temperature'], unit: '\u00B0C' }
          : metric === 'busy'
            ? { entityIncludes: ['busy'], friendlyIncludes: ['busy'], unit: '%' }
            : {
                entityIncludes: [metric === 'read' ? 'read' : 'write'],
                friendlyIncludes: [metric === 'read' ? 'read' : 'write', 'throughput'],
                unit: 'B/s'
              };
    if (prefixedEntries.length > 0) {
      return findBestMetricEntityId(prefixedEntries, matcher);
    }

    const payloadEntries = getPayloadNamedEntries(states, 'disk', diskSlug);
    if (payloadEntries.length > 0) {
      return findBestMetricEntityId(payloadEntries, matcher);
    }

    return findBestMetricEntityId(
      getStateEntries(states).filter(([, entity]) => includesFriendlyText(entity, [diskSlug])),
      { ...matcher, entityIncludes: [], friendlyIncludes: [diskSlug, ...matcher.friendlyIncludes] }
    );
  });
};

const resolveDiskTextMetricEntityId = (
  states: Record<string, HassEntityLike>,
  hostSlug: string,
  diskSlug: string,
  metric: 'model' | 'vendor' | 'serial' | 'type'
): string | undefined => {
  return resolveCachedEntityId(states, `diskTextMetric:${hostSlug}:${diskSlug}:${metric}`, () => {
    const exactMap = {
      model: [`sensor.ugos_bridge_host_${hostSlug}_disk_${diskSlug}_model`, `sensor.ugos_bridge_disk_${diskSlug}_model`],
      vendor: [`sensor.ugos_bridge_host_${hostSlug}_disk_${diskSlug}_vendor`, `sensor.ugos_bridge_disk_${diskSlug}_vendor`],
      serial: [`sensor.ugos_bridge_host_${hostSlug}_disk_${diskSlug}_serial`, `sensor.ugos_bridge_disk_${diskSlug}_serial`],
      type: [`sensor.ugos_bridge_host_${hostSlug}_disk_${diskSlug}_media_type`, `sensor.ugos_bridge_disk_${diskSlug}_media_type`]
    };

    const exactEntityId = firstExistingEntityId(states, exactMap[metric]);
    if (exactEntityId) {
      return exactEntityId;
    }

    const prefixes = [
      `sensor.ugos_bridge_host_${hostSlug}_disk_${diskSlug}_`,
      `sensor.${hostSlug}_disk_${diskSlug}_`,
      `sensor.ugos_bridge_disk_${diskSlug}_`
    ];
    const matcher =
      metric === 'type'
        ? { entityIncludes: ['media'], friendlyIncludes: ['media'] }
        : { entityIncludes: [metric], friendlyIncludes: [metric] };
    const prefixedEntries = getEntriesByPrefixes(states, prefixes);
    if (prefixedEntries.length > 0) {
      return findBestMetricEntityId(prefixedEntries, matcher);
    }

    const payloadEntries = getPayloadNamedEntries(states, 'disk', diskSlug);
    if (payloadEntries.length > 0) {
      return findBestMetricEntityId(payloadEntries, matcher);
    }

    return findBestMetricEntityId(
      getStateEntries(states).filter(([, entity]) => includesFriendlyText(entity, [diskSlug])),
      { entityIncludes: [], friendlyIncludes: [diskSlug, ...matcher.friendlyIncludes] }
    );
  });
};

const resolveFilesystemMetricEntityId = (
  states: Record<string, HassEntityLike>,
  hostSlug: string,
  filesystemSlug: string,
  metric: 'used' | 'free'
): string | undefined => {
  return resolveCachedEntityId(states, `filesystemMetric:${hostSlug}:${filesystemSlug}:${metric}`, () => {
    const exactMap = {
      used: [
        `sensor.ugos_bridge_host_${hostSlug}_filesystem_${filesystemSlug}_used_bytes`,
        `sensor.ugos_bridge_filesystem_${filesystemSlug}_used_bytes`
      ],
      free: [
        `sensor.ugos_bridge_host_${hostSlug}_filesystem_${filesystemSlug}_free_bytes`,
        `sensor.ugos_bridge_filesystem_${filesystemSlug}_free_bytes`
      ]
    };

    const exactEntityId = firstExistingEntityId(states, exactMap[metric]);
    if (exactEntityId) {
      return exactEntityId;
    }

    const prefixes = [
      `sensor.ugos_bridge_host_${hostSlug}_filesystem_${filesystemSlug}_`,
      `sensor.${hostSlug}_filesystem_${filesystemSlug}_`,
      `sensor.ugos_bridge_filesystem_${filesystemSlug}_`
    ];
    const prefixedEntries = getEntriesByPrefixes(states, prefixes);
    if (prefixedEntries.length > 0) {
      return findBestMetricEntityId(prefixedEntries, { entityIncludes: [metric], friendlyIncludes: [metric], unit: 'B' });
    }

    const payloadEntries = getPayloadNamedEntries(states, 'filesystem', filesystemSlug);
    if (payloadEntries.length > 0) {
      return findBestMetricEntityId(payloadEntries, { entityIncludes: [metric], friendlyIncludes: [metric], unit: 'B' });
    }

    return findBestMetricEntityId(
      getStateEntries(states).filter(([, entity]) => getFriendlyFilesystemSlug(entity, hostSlug) === filesystemSlug),
      { entityIncludes: [metric], friendlyIncludes: [metric], unit: 'B' }
    );
  });
};

const resolveFilesystemReadonlyEntityId = (
  states: Record<string, HassEntityLike>,
  hostSlug: string,
  filesystemSlug: string
): string | undefined => {
  return resolveCachedEntityId(states, `filesystemReadonly:${hostSlug}:${filesystemSlug}`, () => {
    const exactEntityId = firstExistingEntityId(states, [
      `binary_sensor.ugos_bridge_host_${hostSlug}_filesystem_${filesystemSlug}_read_only`,
      `binary_sensor.ugos_bridge_filesystem_${filesystemSlug}_read_only`
    ]);
    if (exactEntityId) {
      return exactEntityId;
    }

    const prefixes = [
      `binary_sensor.ugos_bridge_host_${hostSlug}_filesystem_${filesystemSlug}_`,
      `binary_sensor.${hostSlug}_filesystem_${filesystemSlug}_`,
      `binary_sensor.ugos_bridge_filesystem_${filesystemSlug}_`
    ];
    const prefixedEntries = getEntriesByPrefixes(states, prefixes);
    if (prefixedEntries.length > 0) {
      return findBestMetricEntityId(prefixedEntries, { entityIncludes: ['read'], friendlyIncludes: ['read', 'only'] });
    }

    const payloadEntries = getPayloadNamedEntries(states, 'filesystem', filesystemSlug, 'binary_sensor.');
    if (payloadEntries.length > 0) {
      return findBestMetricEntityId(payloadEntries, { entityIncludes: ['read'], friendlyIncludes: ['read', 'only'] });
    }

    return findBestMetricEntityId(
      getStateEntries(states).filter(([, entity]) => getFriendlyFilesystemSlug(entity, hostSlug) === filesystemSlug),
      { entityIncludes: ['read'], friendlyIncludes: ['read', 'only'] }
    );
  });
};

const resolveArrayMetricEntityId = (
  states: Record<string, HassEntityLike>,
  hostSlug: string,
  arraySlug: string,
  metric: 'size' | 'degraded' | 'active' | 'total' | 'sync'
): string | undefined => {
  return resolveCachedEntityId(states, `arrayMetric:${hostSlug}:${arraySlug}:${metric}`, () => {
    const exactMap = {
      size: [`sensor.ugos_bridge_host_${hostSlug}_array_${arraySlug}_size_bytes`, `sensor.ugos_bridge_array_${arraySlug}_size_bytes`],
      degraded: [
        `sensor.ugos_bridge_host_${hostSlug}_array_${arraySlug}_degraded_disks`,
        `sensor.ugos_bridge_array_${arraySlug}_degraded_disks`
      ],
      active: [
        `sensor.ugos_bridge_host_${hostSlug}_array_${arraySlug}_active_disks`,
        `sensor.ugos_bridge_array_${arraySlug}_active_disks`
      ],
      total: [`sensor.ugos_bridge_host_${hostSlug}_array_${arraySlug}_total_disks`, `sensor.ugos_bridge_array_${arraySlug}_total_disks`],
      sync: [
        `sensor.ugos_bridge_host_${hostSlug}_array_${arraySlug}_sync_completed_percent`,
        `sensor.ugos_bridge_array_${arraySlug}_sync_completed_percent`
      ]
    };

    const exactEntityId = firstExistingEntityId(states, exactMap[metric]);
    if (exactEntityId) {
      return exactEntityId;
    }

    const prefixes = [
      `sensor.ugos_bridge_host_${hostSlug}_array_${arraySlug}_`,
      `sensor.${hostSlug}_array_${arraySlug}_`,
      `sensor.ugos_bridge_array_${arraySlug}_`
    ];
    const matcher =
      metric === 'size'
        ? { entityIncludes: ['size'], friendlyIncludes: ['size'], unit: 'B' }
        : metric === 'degraded'
          ? { entityIncludes: ['degraded'], friendlyIncludes: ['degraded'] }
          : metric === 'active'
            ? { entityIncludes: ['active'], friendlyIncludes: ['active', 'disks'] }
            : metric === 'total'
              ? { entityIncludes: ['total'], friendlyIncludes: ['total', 'disks'] }
          : { entityIncludes: ['sync'], friendlyIncludes: ['sync'], unit: '%' };
    const prefixedEntries = getEntriesByPrefixes(states, prefixes);
    if (prefixedEntries.length > 0) {
      return findBestMetricEntityId(prefixedEntries, matcher);
    }

    const payloadEntries = getPayloadNamedEntries(states, 'array', arraySlug);
    if (payloadEntries.length > 0) {
      return findBestMetricEntityId(payloadEntries, matcher);
    }

    return findBestMetricEntityId(
      getStateEntries(states).filter(([, entity]) => includesFriendlyText(entity, [arraySlug])),
      { ...matcher, entityIncludes: [], friendlyIncludes: [arraySlug, ...matcher.friendlyIncludes] }
    );
  });
};

const resolveArrayTextMetricEntityId = (
  states: Record<string, HassEntityLike>,
  hostSlug: string,
  arraySlug: string,
  metric: 'level'
): string | undefined => {
  return resolveCachedEntityId(states, `arrayTextMetric:${hostSlug}:${arraySlug}:${metric}`, () => {
    const exactMap = {
      level: [`sensor.ugos_bridge_host_${hostSlug}_array_${arraySlug}_level`, `sensor.ugos_bridge_array_${arraySlug}_level`]
    };

    const exactEntityId = firstExistingEntityId(states, exactMap[metric]);
    if (exactEntityId) {
      return exactEntityId;
    }

    const prefixes = [
      `sensor.ugos_bridge_host_${hostSlug}_array_${arraySlug}_`,
      `sensor.${hostSlug}_array_${arraySlug}_`,
      `sensor.ugos_bridge_array_${arraySlug}_`
    ];
    const prefixedEntries = getEntriesByPrefixes(states, prefixes);
    if (prefixedEntries.length > 0) {
      return findBestMetricEntityId(prefixedEntries, { entityIncludes: ['level'], friendlyIncludes: ['level'] });
    }

    const payloadEntries = getPayloadNamedEntries(states, 'array', arraySlug);
    if (payloadEntries.length > 0) {
      return findBestMetricEntityId(payloadEntries, { entityIncludes: ['level'], friendlyIncludes: ['level'] });
    }

    return findBestMetricEntityId(
      getStateEntries(states).filter(([, entity]) => includesFriendlyText(entity, [arraySlug, 'level'])),
      { entityIncludes: [], friendlyIncludes: [arraySlug, 'level'] }
    );
  });
};

const resolveNetworkMetricEntityId = (
  states: Record<string, HassEntityLike>,
  hostSlug: string,
  networkSlug: string,
  metric: 'rx' | 'tx' | 'speed'
): string | undefined => {
  return resolveCachedEntityId(states, `networkMetric:${hostSlug}:${networkSlug}:${metric}`, () => {
    const exactMap = {
      rx: [
        `sensor.ugos_bridge_host_${hostSlug}_network_${networkSlug}_rx_bytes_per_second`,
        `sensor.ugos_bridge_network_${networkSlug}_rx_bytes_per_second`
      ],
      tx: [
        `sensor.ugos_bridge_host_${hostSlug}_network_${networkSlug}_tx_bytes_per_second`,
        `sensor.ugos_bridge_network_${networkSlug}_tx_bytes_per_second`
      ],
      speed: [
        `sensor.ugos_bridge_host_${hostSlug}_network_${networkSlug}_speed_mbps`,
        `sensor.ugos_bridge_network_${networkSlug}_speed_mbps`
      ]
    };

    const exactEntityId = firstExistingEntityId(states, exactMap[metric]);
    if (exactEntityId) {
      return exactEntityId;
    }

    const prefixes = [
      `sensor.ugos_bridge_host_${hostSlug}_network_${networkSlug}_`,
      `sensor.${hostSlug}_network_${networkSlug}_`,
      `sensor.ugos_bridge_network_${networkSlug}_`
    ];
    const matcher =
      metric === 'speed'
        ? { entityIncludes: ['speed'], friendlyIncludes: ['link', 'speed'], unit: 'Mbit/s' }
        : {
            entityIncludes: [metric],
            friendlyIncludes: [metric === 'rx' ? 'rx' : 'tx', 'throughput'],
            unit: 'B/s'
          };
    const prefixedEntries = getEntriesByPrefixes(states, prefixes);
    if (prefixedEntries.length > 0) {
      return findBestMetricEntityId(prefixedEntries, matcher);
    }

    const payloadEntries = getPayloadNamedEntries(states, 'network', networkSlug);
    if (payloadEntries.length > 0) {
      return findBestMetricEntityId(payloadEntries, matcher);
    }

    return findBestMetricEntityId(
      getStateEntries(states).filter(([, entity]) => includesFriendlyText(entity, [networkSlug])),
      { ...matcher, entityIncludes: [], friendlyIncludes: [networkSlug, ...matcher.friendlyIncludes] }
    );
  });
};

const resolveNetworkCarrierEntityId = (
  states: Record<string, HassEntityLike>,
  hostSlug: string,
  networkSlug: string
): string | undefined => {
  return resolveCachedEntityId(states, `networkCarrier:${hostSlug}:${networkSlug}`, () => {
    const exactEntityId = firstExistingEntityId(states, [
      `binary_sensor.ugos_bridge_host_${hostSlug}_network_${networkSlug}_carrier`,
      `binary_sensor.ugos_bridge_network_${networkSlug}_carrier`
    ]);
    if (exactEntityId) {
      return exactEntityId;
    }

    const prefixes = [
      `binary_sensor.ugos_bridge_host_${hostSlug}_network_${networkSlug}_`,
      `binary_sensor.${hostSlug}_network_${networkSlug}_`,
      `binary_sensor.ugos_bridge_network_${networkSlug}_`
    ];
    const prefixedEntries = getEntriesByPrefixes(states, prefixes);
    if (prefixedEntries.length > 0) {
      return findBestMetricEntityId(prefixedEntries, { entityIncludes: ['carrier'], friendlyIncludes: ['carrier'] });
    }

    const payloadEntries = getPayloadNamedEntries(states, 'network', networkSlug, 'binary_sensor.');
    if (payloadEntries.length > 0) {
      return findBestMetricEntityId(payloadEntries, { entityIncludes: ['carrier'], friendlyIncludes: ['carrier'] });
    }

    return findBestMetricEntityId(
      getEntriesByPrefix(states, 'binary_sensor.').filter(([, entity]) => includesFriendlyText(entity, [networkSlug, 'carrier'])),
      { entityIncludes: [], friendlyIncludes: [networkSlug, 'carrier'] }
    );
  });
};

const resolveBondMetricEntityId = (
  states: Record<string, HassEntityLike>,
  hostSlug: string,
  bondSlug: string,
  metric: 'speed' | 'mode' | 'active_slave'
): string | undefined => {
  return resolveCachedEntityId(states, `bondMetric:${hostSlug}:${bondSlug}:${metric}`, () => {
    const exactMap = {
      speed: [`sensor.ugos_bridge_host_${hostSlug}_bond_${bondSlug}_speed_mbps`, `sensor.ugos_bridge_bond_${bondSlug}_speed_mbps`],
      mode: [`sensor.ugos_bridge_host_${hostSlug}_bond_${bondSlug}_mode`, `sensor.ugos_bridge_bond_${bondSlug}_mode`],
      active_slave: [
        `sensor.ugos_bridge_host_${hostSlug}_bond_${bondSlug}_active_slave`,
        `sensor.ugos_bridge_bond_${bondSlug}_active_slave`
      ]
    };

    const exactEntityId = firstExistingEntityId(states, exactMap[metric]);
    if (exactEntityId) {
      return exactEntityId;
    }

    const prefixes = [
      `sensor.ugos_bridge_host_${hostSlug}_bond_${bondSlug}_`,
      `sensor.${hostSlug}_bond_${bondSlug}_`,
      `sensor.ugos_bridge_bond_${bondSlug}_`
    ];
    const matcher =
      metric === 'speed'
        ? { entityIncludes: ['speed'], friendlyIncludes: ['link', 'speed'], unit: 'Mbit/s' }
        : metric === 'mode'
          ? { entityIncludes: ['mode'], friendlyIncludes: ['mode'] }
          : { entityIncludes: ['active'], friendlyIncludes: ['active', 'slave'] };
    const prefixedEntries = getEntriesByPrefixes(states, prefixes);
    if (prefixedEntries.length > 0) {
      return findBestMetricEntityId(prefixedEntries, matcher);
    }

    const payloadEntries = getPayloadNamedEntries(states, 'bond', bondSlug);
    if (payloadEntries.length > 0) {
      return findBestMetricEntityId(payloadEntries, matcher);
    }

    return findBestMetricEntityId(
      getStateEntries(states).filter(([, entity]) => includesFriendlyText(entity, [bondSlug])),
      { ...matcher, entityIncludes: [], friendlyIncludes: [bondSlug, ...matcher.friendlyIncludes] }
    );
  });
};

const resolveBondCarrierEntityId = (
  states: Record<string, HassEntityLike>,
  hostSlug: string,
  bondSlug: string
): string | undefined => {
  return resolveCachedEntityId(states, `bondCarrier:${hostSlug}:${bondSlug}`, () => {
    const exactEntityId = firstExistingEntityId(states, [
      `binary_sensor.ugos_bridge_host_${hostSlug}_bond_${bondSlug}_carrier`,
      `binary_sensor.ugos_bridge_bond_${bondSlug}_carrier`
    ]);
    if (exactEntityId) {
      return exactEntityId;
    }

    const prefixes = [
      `binary_sensor.ugos_bridge_host_${hostSlug}_bond_${bondSlug}_`,
      `binary_sensor.${hostSlug}_bond_${bondSlug}_`,
      `binary_sensor.ugos_bridge_bond_${bondSlug}_`
    ];
    const prefixedEntries = getEntriesByPrefixes(states, prefixes);
    if (prefixedEntries.length > 0) {
      return findBestMetricEntityId(prefixedEntries, { entityIncludes: ['carrier'], friendlyIncludes: ['carrier'] });
    }

    const payloadEntries = getPayloadNamedEntries(states, 'bond', bondSlug, 'binary_sensor.');
    if (payloadEntries.length > 0) {
      return findBestMetricEntityId(payloadEntries, { entityIncludes: ['carrier'], friendlyIncludes: ['carrier'] });
    }

    return findBestMetricEntityId(
      getEntriesByPrefix(states, 'binary_sensor.').filter(([, entity]) => includesFriendlyText(entity, [bondSlug, 'carrier'])),
      { entityIncludes: [], friendlyIncludes: [bondSlug, 'carrier'] }
    );
  });
};

const resolveGpuMetricEntityId = (
  states: Record<string, HassEntityLike>,
  hostSlug: string,
  hostPrefix: string,
  gpuSlug: string,
  metric: 'busy' | 'current' | 'max'
): string | undefined => {
  return resolveCachedEntityId(states, `gpuMetric:${hostSlug}:${hostPrefix}:${gpuSlug}:${metric}`, () => {
    const exactMap = {
      busy: [`sensor.${hostPrefix}_gpu_${gpuSlug}_busy_percent`, `sensor.ugos_bridge_gpu_${gpuSlug}_busy_percent`],
      current: [`sensor.${hostPrefix}_gpu_${gpuSlug}_current_mhz`, `sensor.ugos_bridge_gpu_${gpuSlug}_current_mhz`],
      max: [`sensor.${hostPrefix}_gpu_${gpuSlug}_max_mhz`, `sensor.ugos_bridge_gpu_${gpuSlug}_max_mhz`]
    };

    const exactEntityId = firstExistingEntityId(states, exactMap[metric]);
    if (exactEntityId) {
      return exactEntityId;
    }

    const prefixes = [
      `sensor.${hostPrefix}_gpu_${gpuSlug}_`,
      `sensor.${hostSlug}_gpu_${gpuSlug}_`,
      `sensor.ugos_bridge_gpu_${gpuSlug}_`
    ];
    const prefixedEntries = getEntriesByPrefixes(states, prefixes);
    const matcher =
      metric === 'busy'
        ? { entityIncludes: ['busy'], friendlyIncludes: ['busy'], unit: '%' }
        : { entityIncludes: [metric], friendlyIncludes: [metric, 'frequency'], unit: 'MHz' };
    return (
      findBestMetricEntityId(prefixedEntries, matcher) ??
      findBestMetricEntityId(getPayloadNamedEntries(states, 'gpu', gpuSlug), matcher)
    );
  });
};

const resolveGpuDetailEntityIds = (
  states: Record<string, HassEntityLike>,
  hostSlug: string,
  hostPrefix: string,
  gpuSlug: string,
  preferredEntityIds: Array<string | undefined>
): string[] => {
  const preferred = preferredEntityIds.filter((entityId): entityId is string => isUsableEntityState(states[entityId ?? '']));
  const discovered = getGpuEntityEntries(states, hostSlug, hostPrefix, gpuSlug)
    .filter(
      ([, entity]) =>
        getObjectArrayAttribute(entity, 'engines').length > 0 ||
        getObjectArrayAttribute(entity, 'stats').length > 0
    )
    .map(([entityId]) => entityId);

  return Array.from(new Set([...preferred, ...discovered]));
};

const getGpuEntityEntries = (
  states: Record<string, HassEntityLike>,
  hostSlug: string,
  hostPrefix: string,
  gpuSlug: string
): Array<[string, HassEntityLike]> =>
  getComputedResult(states, `gpuEntries:${hostSlug}:${hostPrefix}:${gpuSlug}`, () => {
    const prefixes = [
      `sensor.${hostPrefix}_gpu_${gpuSlug}_`,
      `sensor.${hostSlug}_gpu_${gpuSlug}_`,
      `sensor.ugos_bridge_gpu_${gpuSlug}_`
    ];
    const prefixedEntries = getEntriesByPrefixes(states, prefixes);
    const payloadEntries = getPayloadNamedEntries(states, 'gpu', gpuSlug);
    const namedEntries = getStateEntries(states).filter(
      ([entityId, entity]) =>
        entityId.startsWith('sensor.') &&
        slugify(getStringAttribute(entity, 'name') ?? '') === gpuSlug &&
        (getObjectArrayAttribute(entity, 'engines').length > 0 ||
          getObjectArrayAttribute(entity, 'stats').length > 0 ||
          getNumberAttribute(entity, 'busy_percent') !== undefined ||
          getNumberAttribute(entity, 'current_mhz') !== undefined ||
          getNumberAttribute(entity, 'max_mhz') !== undefined)
    );

    return Array.from(new Map([...prefixedEntries, ...payloadEntries, ...namedEntries]).entries());
  });

const resolveProjectMetricEntityId = (
  states: Record<string, HassEntityLike>,
  projectSlug: string,
  metric: 'cpu' | 'memory' | 'total' | 'running'
): string | undefined => {
  return resolveCachedEntityId(states, `projectMetric:${projectSlug}:${metric}`, () => {
    const exactMap = {
      cpu: `sensor.ugos_bridge_project_${projectSlug}_cpu_usage_percent`,
      memory: `sensor.ugos_bridge_project_${projectSlug}_memory_usage_bytes`,
      total: `sensor.ugos_bridge_project_${projectSlug}_total_containers`,
      running: `sensor.ugos_bridge_project_${projectSlug}_running_containers`
    };

    if (states[exactMap[metric]]) {
      return exactMap[metric];
    }

    const prefixes = [
      `sensor.ugos_bridge_project_${projectSlug}_`,
      `sensor.compose_project_${projectSlug}_`,
      `sensor.project_${projectSlug}_`,
      ...(projectSlug === 'virtual_machines' ? ['sensor.virtual_machines_'] : [])
    ];
    const prefixedEntries = getEntriesByPrefixes(states, prefixes);
    const matcher =
      metric === 'cpu'
        ? { entityIncludes: ['cpu'], friendlyIncludes: ['cpu'], unit: '%' }
        : metric === 'memory'
          ? { entityIncludes: ['memory'], friendlyIncludes: ['memory'], unit: 'B' }
          : metric === 'total'
            ? { entityIncludes: ['total'], friendlyIncludes: ['total', 'containers'] }
            : { entityIncludes: ['running'], friendlyIncludes: ['running', 'containers'] };

    if (prefixedEntries.length > 0) {
      return findBestEntityId(prefixedEntries, matcher);
    }

    return findBestEntityId(
      getStateEntries(states).filter(([, entity]) => getFriendlyProjectSlug(entity) === projectSlug),
      matcher
    );
  });
};

const resolveProjectPayloadEntityId = (states: Record<string, HassEntityLike>, projectSlug: string): string | undefined => {
  return resolveCachedEntityId(states, `projectPayload:${projectSlug}`, () => {
    let bestEntityId: string | undefined;
    let bestScore = -1;

    for (const [entityId, entity] of getStateEntries(states)) {
      if (!entityId.startsWith('sensor.')) {
        continue;
      }

      const entityProjectSlug = normalizeProjectSlug(getStringAttribute(entity, 'project_slug') ?? getStringAttribute(entity, 'project'));
      if (entityProjectSlug !== projectSlug) {
        continue;
      }

      let score = 0;
      if (getObjectArrayAttribute(entity, 'containers').length > 0) {
        score += 8;
      }
      if (getNumberAttribute(entity, 'total_containers') !== undefined) {
        score += 4;
      }
      if (getNumberAttribute(entity, 'running_containers') !== undefined) {
        score += 3;
      }
      if (getNumberAttribute(entity, 'memory_usage_bytes') !== undefined) {
        score += 2;
      }
      if (getNumberAttribute(entity, 'cpu_usage_percent') !== undefined) {
        score += 2;
      }
      if (entityId.startsWith('sensor.compose_project_')) {
        score += 3;
      }
      if (entityId.startsWith('sensor.ugos_bridge_project_')) {
        score += 3;
      }

      if (score > bestScore || (score === bestScore && bestEntityId !== undefined && entityId.localeCompare(bestEntityId) < 0)) {
        bestEntityId = entityId;
        bestScore = score;
      } else if (bestEntityId === undefined) {
        bestEntityId = entityId;
        bestScore = score;
      }
    }

    return bestEntityId;
  });
};

const matchesSelector = (slug: string, name: string, selectors: string[]): boolean => {
  const normalizedSlug = slugify(slug);
  const normalizedName = slugify(name);
  return selectors.some((selector) => {
    const normalizedSelector = slugify(selector);
    return normalizedSelector === normalizedSlug || normalizedSelector === normalizedName;
  });
};

const pushHistorySample = (previousHistory: MetricHistoryState, sample: MetricHistorySample): MetricHistoryState => {
  if (previousHistory.samples.at(-1)?.key === sample.key) {
    return previousHistory;
  }

  return {
    samples: [...previousHistory.samples, sample].slice(-HISTORY_LIMIT)
  };
};

const ensureSeries = (values: number[], fallbackValue: number, minimumLength: number): number[] => {
  if (values.length >= minimumLength) {
    return values.slice(-HISTORY_LIMIT);
  }

  const fillLength = Math.max(minimumLength - values.length, 0);
  return [...Array.from({ length: fillLength }, () => fallbackValue), ...values];
};

const ensureTrafficSeries = (
  samples: MetricHistorySample[],
  trafficLineSlugs: string[],
  currentTotalsBySlug: Record<string, number>
): TrafficPoint[] => {
  const baseSamples =
    samples.length > 0
      ? samples
      : [{ key: 'initial', timestampLabel: '', cpuPercent: 0, ramPercent: 0, gpuPercent: 0, load1: 0, networkBpsBySlug: currentTotalsBySlug }];
  const fillLength = Math.max(5 - baseSamples.length, 0);
  const preparedSamples = [...Array.from({ length: fillLength }, () => baseSamples[0]), ...baseSamples];

  return preparedSamples.map((sample) => ({
    timestampLabel: sample.timestampLabel,
    totalsByInterface: Object.fromEntries(
      trafficLineSlugs.map((networkSlug) => [networkSlug, sample.networkBpsBySlug[networkSlug] ?? 0])
    )
  }));
};

const pickTemperature = (temperatures: TemperatureSnapshot[], preferredTerms: string[]): number | undefined => {
  const preferredTemperature = temperatures.find((temperature) =>
    preferredTerms.some((term) => temperature.label.includes(term))
  );
  if (preferredTemperature) {
    return preferredTemperature.value;
  }

  return temperatures.find((temperature) => !temperature.entityId.includes('_disk_'))?.value;
};

const pickInterfaceTemperature = (temperatures: TemperatureSnapshot[], interfaceSlug: string): number | undefined => {
  const normalizedSlug = interfaceSlug.toLowerCase();
  const directMatch = temperatures.find(
    (temperature) =>
      temperature.label.includes(normalizedSlug) &&
      (temperature.label.includes('phy temperature') || temperature.label.includes('mac temperature'))
  );
  if (directMatch) {
    return directMatch.value;
  }

  return temperatures.find((temperature) => temperature.label.includes(normalizedSlug))?.value;
};

const deriveDriveStatus = (temperatureCelsius: number | undefined): HealthStatus => {
  if (temperatureCelsius === undefined) {
    return 'healthy';
  }
  if (temperatureCelsius >= 55) {
    return 'degraded';
  }
  if (temperatureCelsius >= 48) {
    return 'warning';
  }
  return 'healthy';
};

const loadLabel = (load1: number): string => {
  if (load1 >= 3) {
    return 'High';
  }
  if (load1 >= 1) {
    return 'Busy';
  }
  return 'Good';
};

const loadPercentLabel = (valuePercent: number): string => {
  if (valuePercent >= 90) {
    return 'High';
  }
  if (valuePercent >= 70) {
    return 'Busy';
  }
  return 'Good';
};

const clampPercent = (value: number): number => Math.max(0, Math.min(100, value));

const formatLoadPercent = (value: number): string => {
  const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)}%`;
};

const hasEntityPrefix = (states: Record<string, HassEntityLike>, slug: string): boolean =>
  getComputedResult(states, `hasEntityPrefix:${slug}`, () =>
    getStateKeys(states).some((entityId) => entityId.startsWith(`sensor.${slug}_`) || entityId.startsWith(`binary_sensor.${slug}_`))
  );

const hasBridgeHostEntityPrefix = (states: Record<string, HassEntityLike>, slug: string): boolean =>
  getComputedResult(states, `hasBridgeHostEntityPrefix:${slug}`, () =>
    getStateKeys(states).some(
      (entityId) =>
        entityId.startsWith(`sensor.ugos_bridge_host_${slug}_`) ||
        entityId.startsWith(`binary_sensor.ugos_bridge_host_${slug}_`)
    )
  );

const collectHostSlugCandidates = (states: Record<string, HassEntityLike>): string[] =>
  getComputedResult(states, 'hostSlugCandidates', () => {
    const scores = new Map<string, number>();
    const addCandidate = (slug: string | undefined, score: number): void => {
      if (slug === undefined || slug.startsWith('ugos_bridge_')) {
        return;
      }
      scores.set(slug, (scores.get(slug) ?? 0) + score);
    };

    for (const entityId of getStateKeys(states)) {
      addCandidate(hostCpuRegex.exec(entityId)?.[1], 1000);
      addCandidate(bridgeHostChildRegex.exec(entityId)?.[1], 500);
      addCandidate(legacyHostCpuRegex.exec(entityId)?.[1], 100);
      addCandidate(haNamedHostChildRegex.exec(entityId)?.[1], 1);
    }

    return Array.from(scores.entries())
      .sort(([leftSlug, leftScore], [rightSlug, rightScore]) => rightScore - leftScore || leftSlug.localeCompare(rightSlug))
      .map(([slug]) => slug);
  });

const buildWatchPrefixes = (hostSlug: string): string[] => [
  `sensor.ugos_bridge_host_${hostSlug}_`,
  `binary_sensor.ugos_bridge_host_${hostSlug}_`,
  `sensor.${hostSlug}_`,
  `binary_sensor.${hostSlug}_`,
  'sensor.ugos_bridge_disk_',
  'sensor.ugos_bridge_filesystem_',
  'binary_sensor.ugos_bridge_filesystem_',
  'sensor.ugos_bridge_network_',
  'binary_sensor.ugos_bridge_network_',
  'sensor.ugos_bridge_bond_',
  'binary_sensor.ugos_bridge_bond_',
  'sensor.ugos_bridge_array_',
  'binary_sensor.ugos_bridge_array_',
  'sensor.ugos_bridge_gpu_',
  'sensor.ugos_bridge_project_',
  'sensor.compose_project_',
  'sensor.ugos_bridge_container_',
  'binary_sensor.ugos_bridge_container_',
  'sensor.ugos_bridge_vm_',
  'binary_sensor.ugos_bridge_vm_',
  'sensor.ugos_bridge_process_'
];

const collectWatchedEntityIds = (
  states: Record<string, HassEntityLike>,
  watchPrefixes: string[],
  ipEntity: string | undefined
): string[] =>
  getStateKeys(states)
    .filter((entityId) => {
      if (ipEntity !== undefined && entityId === ipEntity) {
        return true;
      }
      if (watchPrefixes.some((prefix) => entityId.startsWith(prefix))) {
        return true;
      }

      const entity = states[entityId];
      return (
        getStringAttribute(entity, 'container') !== undefined ||
        getStringAttribute(entity, 'project') !== undefined ||
        getNumberAttribute(entity, 'process_count') !== undefined ||
        getNumberAttribute(entity, 'cpu_time_seconds') !== undefined
      );
    })
    .sort();

const isHostRootSensorEntity = (entityId: string, hostSlug: string): boolean =>
  entityId.startsWith(`sensor.${hostSlug}_`) &&
  !['_array_', '_bond_', '_cooling_', '_disk_', '_filesystem_', '_gpu_', '_health_', '_network_', '_software_', '_ups_'].some((token) =>
    entityId.includes(token)
  );

const findBestEntityId = (
  entries: Array<[string, HassEntityLike]>,
  options: {
    entityIncludes: string[];
    friendlyIncludes: string[];
    unit?: string;
  }
): string | undefined => {
  let bestEntityId: string | undefined;
  let bestScore = -1;

  entryLoop:
  for (const [entityId, entity] of entries) {
    const entityText = entityId.toLowerCase();
    const friendlyText = getFriendlyNameLower(entity);
    const unit = getUnit(entity);
    const isUsable = isUsableEntityState(entity);

    if (options.unit && unit !== options.unit) {
      continue;
    }

    let score = isUsable ? 100 : -100;
    for (const token of options.entityIncludes) {
      if (!entityText.includes(token)) {
        continue entryLoop;
      }
      score += 2;
    }

    for (const token of options.friendlyIncludes) {
      if (!friendlyText.includes(token)) {
        continue entryLoop;
      }
      score += 1;
    }

    if (score > bestScore || (score === bestScore && bestEntityId !== undefined && entityId.localeCompare(bestEntityId) < 0)) {
      bestEntityId = entityId;
      bestScore = score;
    } else if (bestEntityId === undefined) {
      bestEntityId = entityId;
      bestScore = score;
    }
  }

  return bestEntityId;
};

const collectEntitySlugs = (states: Record<string, HassEntityLike>, matcher: RegExp): string[] =>
  getComputedResult(states, `entitySlugs:${matcher.source}`, () =>
    Array.from(
      new Set(
        getStateKeys(states)
          .map((entityId) => matcher.exec(entityId)?.[1])
          .filter((slug): slug is string => Boolean(slug))
      )
    ).sort()
  );

const collectComponentEntitySlugs = (
  states: Record<string, HassEntityLike>,
  hostSlug: string,
  hostPrefix: string,
  component: 'array' | 'bond' | 'disk' | 'filesystem' | 'gpu' | 'network',
  isLikelySlug: (value: string) => boolean
): string[] =>
  getComputedResult(states, `componentSlugs:${hostSlug}:${hostPrefix}:${component}`, () => {
    const matchers = [
      new RegExp(`^(?:sensor|binary_sensor)\\.${escapeRegExp(hostPrefix)}_${component}_([^_]+)_`),
      new RegExp(`^(?:sensor|binary_sensor)\\.${escapeRegExp(hostSlug)}_${component}_([^_]+)_`),
      new RegExp(`^(?:sensor|binary_sensor)\\.ugos_bridge_${component}_([^_]+)_`)
    ];

    return Array.from(
      new Set(
        getStateKeys(states)
          .flatMap((entityId) => matchers.map((matcher) => matcher.exec(entityId)?.[1]).filter((slug): slug is string => Boolean(slug)))
          .map((slug) => slugify(slug))
          .filter((slug) => Boolean(slug) && isLikelySlug(slug))
      )
    ).sort();
  });

const isUsableEntityState = (entity: HassEntityLike | undefined): boolean =>
  entity !== undefined && entity.state !== 'unknown' && entity.state !== 'unavailable';

const getNumberState = (states: Record<string, HassEntityLike>, entityId: string | undefined): number | undefined =>
  entityId ? getParsedNumber(states[entityId]) : undefined;

const getTextState = (states: Record<string, HassEntityLike>, entityId: string | undefined): string | undefined => {
  if (!entityId) {
    return undefined;
  }

  const entity = states[entityId];
  const cache = getEntityDerivedCache(entity);
  if (!cache) {
    return undefined;
  }

  if (cache.textState !== undefined) {
    return cache.textState ?? undefined;
  }

  const value = entity.state;
  cache.textState = !value || value === 'unknown' || value === 'unavailable' ? null : value;
  return cache.textState ?? undefined;
};

const getStringAttribute = (entity: HassEntityLike | undefined, key: string): string | undefined => {
  const value = entity?.attributes[key];
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
};

const getNumberAttribute = (entity: HassEntityLike | undefined, key: string): number | undefined => {
  const value = entity?.attributes[key];
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    return parseNumber(value);
  }
  return undefined;
};

const getBooleanAttribute = (entity: HassEntityLike | undefined, key: string): boolean | undefined => {
  const value = entity?.attributes[key];
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === '1' || normalized === 'true' || normalized === 'on' || normalized === 'running') {
      return true;
    }
    if (normalized === '0' || normalized === 'false' || normalized === 'off' || normalized === 'stopped') {
      return false;
    }
  }
  return undefined;
};

const getStringArrayAttribute = (entity: HassEntityLike | undefined, key: string): string[] => {
  const value = entity?.attributes[key];
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
};

const getFirstStringArrayAttribute = (entities: Array<HassEntityLike | undefined>, key: string): string[] => {
  for (const entity of entities) {
    const values = getStringArrayAttribute(entity, key);
    if (values.length > 0) {
      return values;
    }
  }
  return [];
};

const getObjectArrayAttribute = (entity: HassEntityLike | undefined, key: string): Array<Record<string, unknown>> => {
  const value = entity?.attributes[key];
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
};

const readString = (record: Record<string, unknown>, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }
  return undefined;
};

const readBooleanRecord = (record: Record<string, unknown>, keys: string[]): boolean | undefined => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === '1' || normalized === 'true' || normalized === 'on' || normalized === 'running') {
        return true;
      }
      if (normalized === '0' || normalized === 'false' || normalized === 'off' || normalized === 'stopped') {
        return false;
      }
    }
  }
  return undefined;
};

const readNumber = (record: Record<string, unknown>, keys: string[]): number | undefined => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseNumber(value);
      if (parsed !== undefined) {
        return parsed;
      }
    }
  }
  return undefined;
};

const parseNumber = (value: string | undefined): number | undefined => {
  if (!value || value === 'unknown' || value === 'unavailable') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const getParsedNumber = (entity: HassEntityLike | undefined): number | undefined => {
  const cache = getEntityDerivedCache(entity);
  if (!cache || !entity) {
    return undefined;
  }

  if (cache.parsedNumber !== undefined) {
    return cache.parsedNumber ?? undefined;
  }

  cache.parsedNumber = parseNumber(entity.state) ?? null;
  return cache.parsedNumber ?? undefined;
};

const isBinaryOn = (entity: HassEntityLike | undefined): boolean => entity?.state === 'on';

function normalizeUnit(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  if (normalized === '\u00B0C' || normalized === '\u00BAC' || normalized === '\u00C2\u00B0C' || normalized === '\u0412\u00B0C') {
    return '\u00B0C';
  }
  return normalized || undefined;
}

const getUnit = (entity: HassEntityLike | undefined): string | undefined => {
  return getEntityDerivedCache(entity)?.unit;
};

const includesFriendlyText = (entity: HassEntityLike | undefined, tokens: string[]): boolean => {
  const friendlyText = getFriendlyNameLower(entity);
  return tokens.every((token) => friendlyText.includes(token));
};

const extractFriendlyMetricSlug = (
  entity: HassEntityLike | undefined,
  hostSlug: string,
  suffixes: string[]
): string | undefined => {
  const friendlyName = getFriendlyName(entity);
  if (!friendlyName) {
    return undefined;
  }

  const remainder = stripFriendlyHostPrefix(friendlyName, hostSlug);
  if (!remainder) {
    return undefined;
  }

  const normalizedRemainder = remainder.toLowerCase();
  for (const suffix of suffixes) {
    const normalizedSuffix = suffix.toLowerCase();
    if (!normalizedRemainder.endsWith(` ${normalizedSuffix}`)) {
      continue;
    }

    const candidate = remainder.slice(0, remainder.length - suffix.length).trim();
    return candidate ? slugify(candidate) : undefined;
  }

  return undefined;
};

const getFriendlyFilesystemSlug = (entity: HassEntityLike | undefined, hostSlug: string): string | undefined => {
  const friendlyName = getFriendlyName(entity);
  if (!friendlyName) {
    return undefined;
  }

  const normalizedFriendly = friendlyName.toLowerCase();
  const normalizedHost = hostSlug.replace(/_/g, ' ');
  if (!normalizedFriendly.includes(normalizedHost) || !normalizedFriendly.includes('/')) {
    return undefined;
  }

  const pathMatch = friendlyName.match(/(\/[^\s]*)/);
  return pathMatch ? slugify(pathMatch[1]) : undefined;
};

const stripFriendlyHostPrefix = (friendlyName: string, hostSlug: string): string | undefined => {
  const hostLabel = hostSlug.replace(/_/g, ' ');
  if (friendlyName.toLowerCase().startsWith(`${hostLabel.toLowerCase()} `)) {
    return friendlyName.slice(hostLabel.length + 1).trim();
  }

  return undefined;
};

const isLikelyDiskSlug = (value: string): boolean =>
  /^(sd[a-z]+|hd[a-z]+|vd[a-z]+|xvd[a-z]+|nvme\d+n\d+|mmcblk\d+|loop\d+|serial_[a-z0-9_]+|path_[a-f0-9]+|name_[a-z0-9_]+)$/i.test(value);

const isLikelyArraySlug = (value: string): boolean => /^md\d+$/i.test(value);

const isLikelyBondSlug = (value: string): boolean => /^bond\d+$/i.test(value);

const isLikelyNetworkSlug = (value: string): boolean =>
  /^(eth\d+|en[a-z0-9]+|eno\d+|ens\d+|enp[a-z0-9]+|wlan\d+|wl[a-z0-9]+|lo)$/i.test(value);

const normalizeDiskModel = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized || undefined;
};

const normalizeDiskMediaType = (value: string | undefined): string | undefined => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }
  if (normalized === 'hdd' || normalized === 'sata') {
    return 'hdd';
  }
  if (normalized === 'nvme' || normalized === 'ssd') {
    return 'nvme';
  }
  return normalized;
};

const normalizeArrayLevel = (value: string | undefined): string | undefined => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }
  if (normalized === 'linear') {
    return 'JBOD';
  }
  return normalized.toUpperCase();
};

const filesystemToLabel = (value: string): string => {
  const match = value.match(/^\/volume(\d+)$/i);
  if (match) {
    return `Volume ${match[1]}`;
  }
  return value;
};

const inferArrayMediaLabel = (array: ArraySnapshot, drives: DriveInfo[]): string | undefined => {
  const totalsByMedia = drives.reduce<Record<string, number>>((totals, drive) => {
    if (!drive.mediaType) {
      return totals;
    }

    totals[drive.mediaType] = (totals[drive.mediaType] ?? 0) + drive.capacityBytes;
    return totals;
  }, {});

  const bestMatch = Object.entries(totalsByMedia)
    .map(([mediaType, totalBytes]) => ({
      mediaType,
      distance: Math.abs(totalBytes - array.sizeBytes) / Math.max(array.sizeBytes, totalBytes, 1)
    }))
    .sort((left, right) => left.distance - right.distance)[0];

  if (!bestMatch) {
    return undefined;
  }

  return bestMatch.mediaType === 'hdd' ? 'SATA' : bestMatch.mediaType.toUpperCase();
};

const formatArrayDriveCounts = (activeDisks: number | undefined, totalDisks: number | undefined): string | undefined => {
  if (activeDisks === undefined && totalDisks === undefined) {
    return undefined;
  }

  const active = activeDisks ?? totalDisks ?? 0;
  const total = totalDisks ?? activeDisks ?? 0;
  return `Drives ${active}/${total}`;
};

const getFriendlyProjectSlug = (entity: HassEntityLike | undefined): string | undefined => {
  const friendlyName = getFriendlyName(entity);
  if (!friendlyName) {
    return undefined;
  }

  const cleanedName = friendlyName
    .replace(/^(?:(?:compose|docker)\s+)?project\s+/i, '')
    .replace(/\s+(CPU|Memory|Total Containers|Running Containers)$/i, '')
    .trim();
  if (!cleanedName) {
    return undefined;
  }

  const dedupedName = cleanedName
    .split(/\s+/)
    .filter((word, index, words) => index === 0 || word.toLowerCase() !== words[index - 1]?.toLowerCase())
    .join(' ');

  return dedupedName ? slugify(dedupedName) : undefined;
};

const normalizeProjectTitle = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  const normalized = trimmed.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = normalized.split(' ');
  if (tokens.length % 2 === 0) {
    const half = tokens.length / 2;
    const left = tokens.slice(0, half).join(' ').toLowerCase();
    const right = tokens.slice(half).join(' ').toLowerCase();
    if (left === right) {
      return tokens.slice(0, half).join(' ');
    }
  }

  return normalized;
};

const resolveGpuBusyPercent = (
  states: Record<string, HassEntityLike>,
  hostSlug: string,
  hostPrefix: string,
  gpuSlug: string
): number => {
  const engineBusyValues = Object.entries(states)
    .filter(([entityId, entity]) => {
      if (!entityId.startsWith('sensor.')) {
        return false;
      }

      const unit = getUnit(entity);
      if (unit !== '%') {
        return false;
      }

      const text = `${entityId} ${getFriendlyName(entity)}`.toLowerCase();
      const hasHost = text.includes(hostSlug) || text.includes(hostSlug.replace(/_/g, ' '));
      const hasGpu = text.includes(gpuSlug);
      const hasBusy = text.includes('busy');
      const matchesEngine =
        text.includes('render/3d') ||
        text.includes('render_3d') ||
        text.includes('blitter') ||
        text.includes('videoenhance') ||
        text.includes('video_enhance') ||
        text.includes('video/') ||
        text.includes('video_');

      return hasHost && hasGpu && hasBusy && matchesEngine;
    })
    .map(([, entity]) => parseNumber(entity.state))
    .filter((value): value is number => value !== undefined);

  if (engineBusyValues.length > 0) {
    return Math.max(...engineBusyValues);
  }

  return getNumberState(states, resolveGpuMetricEntityId(states, hostSlug, hostPrefix, gpuSlug, 'busy')) ?? 0;
};

const cleanupFriendlyName = (entity: HassEntityLike | undefined, suffix: string, hostName: string): string | null => {
  const friendlyName = getFriendlyName(entity);
  if (!friendlyName) {
    return null;
  }

  let value = friendlyName.trim();
  if (suffix && value.endsWith(` ${suffix}`)) {
    value = value.slice(0, -(` ${suffix}`.length));
  }
  if (hostName && value.startsWith(`${hostName} `)) {
    value = value.slice(hostName.length + 1);
  }
  if (value.startsWith('Compose project ')) {
    value = value.slice('Compose project '.length);
  }

  return value.trim() || null;
};

const getFriendlyName = (entity: HassEntityLike | undefined): string => getEntityDerivedCache(entity)?.friendlyName ?? '';

const getFriendlyNameLower = (entity: HassEntityLike | undefined): string =>
  getEntityDerivedCache(entity)?.friendlyNameLower ?? '';

const normalizeCpuCoreLabel = (value: string): string => {
  const match = value.match(/^cpu\s*(\d+)$/i);
  if (match) {
    return `Core ${match[1]}`;
  }
  return value.replace(/\s+/g, ' ').trim();
};

const compareCpuCoreDetails = (left: CpuCoreDetail, right: CpuCoreDetail): number => {
  const leftIndex = parseNumber(left.key.replace(/[^\d]/g, '')) ?? Number.MAX_SAFE_INTEGER;
  const rightIndex = parseNumber(right.key.replace(/[^\d]/g, '')) ?? Number.MAX_SAFE_INTEGER;
  return leftIndex - rightIndex || left.name.localeCompare(right.name);
};

const normalizeGpuEngineLabel = (value: string): string => {
  const normalized = value.replace(/\/\d+$/g, '').replace(/\/3d/gi, '').replace(/\s+/g, '');
  if (/^render/i.test(normalized)) {
    return 'Render';
  }
  if (/^blitter/i.test(normalized)) {
    return 'Blitter';
  }
  if (/^videoenhance/i.test(normalized)) {
    return 'VideoEnhance';
  }
  if (/^video/i.test(normalized)) {
    return 'Video';
  }
  return value.replace(/\/\d+$/g, '').trim();
};

const normalizeGpuStatLabel = (value: string): string =>
  value
    .split('_')
    .filter(Boolean)
    .map((token) => {
      if (token === 'imc') {
        return 'IMC';
      }
      if (token === 'rc6') {
        return 'RC6';
      }
      if (token === 'mhz') {
        return 'MHz';
      }
      if (token === 'mib') {
        return 'MiB';
      }
      return capitalize(token);
    })
    .join(' ');

const normalizeProjectSlug = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }
  const normalized = slugify(value);
  return normalized === 'unknown' ? undefined : normalized;
};

const getFriendlyContainerMetric = (
  entity: HassEntityLike | undefined
): { key: string; name: string; metric: 'cpu_usage_percent' | 'memory_usage_bytes' | 'running' } | undefined => {
  const friendlyName = getFriendlyName(entity);
  const match = /^(?:Docker container|Virtual machine)\s+(.+?)\s+(CPU|Memory(?: Used)?|Running)$/i.exec(friendlyName);
  if (!match) {
    return undefined;
  }

  const name = collapseRepeatedName(match[1]);
  const suffix = match[2].toLowerCase();
  const metric = suffix === 'cpu' ? 'cpu_usage_percent' : suffix.startsWith('memory') ? 'memory_usage_bytes' : 'running';
  return { key: slugify(name), name, metric };
};

const collapseRepeatedName = (value: string): string => {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.length % 2 === 0) {
    const half = words.length / 2;
    const left = words.slice(0, half);
    const right = words.slice(half);
    if (left.every((word, index) => word.toLowerCase() === right[index]?.toLowerCase())) {
      return left.join(' ');
    }
  }

  return words
    .filter((word, index) => index === 0 || word.toLowerCase() !== words[index - 1]?.toLowerCase())
    .join(' ');
};

const metricSuffixLabel = (metric: string): string => {
  switch (metric) {
    case 'cpu_usage_percent':
      return 'CPU';
    case 'memory_usage_bytes':
      return 'Memory';
    case 'running':
      return 'Running';
    default:
      return '';
  }
};

const inferContainerState = (entity: HassEntityLike | undefined): string => {
  const state = String(entity?.state ?? '').trim().toLowerCase();
  if (!state) {
    return 'unknown';
  }
  if (state === '1' || state === 'on') {
    return 'running';
  }
  if (state === '0' || state === 'off') {
    return 'stopped';
  }
  return state;
};

const inferContainerRunning = (entity: HassEntityLike | undefined, fallbackState?: string): boolean | undefined => {
  const running = getBooleanAttribute(entity, 'running');
  if (running !== undefined) {
    return running;
  }

  const normalizedState = String(entity?.state ?? fallbackState ?? '').trim().toLowerCase();
  if (normalizedState === '1' || normalizedState === 'on' || normalizedState === 'running') {
    return true;
  }
  if (normalizedState === '0' || normalizedState === 'off' || normalizedState === 'stopped' || normalizedState === 'exited') {
    return false;
  }
  return undefined;
};

const inferProjectSlugFromEntity = (
  containerKey: string,
  entity: HassEntityLike | undefined,
  projectSlug: string
): string | undefined => {
  const explicitProject = normalizeProjectSlug(
    getStringAttribute(entity, 'project_slug') ?? getStringAttribute(entity, 'project')
  );
  if (explicitProject) {
    return explicitProject;
  }

  const candidates = [containerKey, getStringAttribute(entity, 'container') ?? '', getStringAttribute(entity, 'image') ?? ''];
  return candidates.some((candidate) => matchesProjectContainerHeuristics(candidate, projectSlug)) ? projectSlug : undefined;
};

const matchesProjectContainerState = (
  container: Partial<DockerContainer> & { key: string },
  projectSlug: string
): boolean => [container.key, container.name ?? '', container.image ?? ''].some((value) => matchesProjectContainerHeuristics(value, projectSlug));

const matchesProjectContainerHeuristics = (value: string, projectSlug: string): boolean => {
  const candidate = value.trim().toLowerCase();
  if (!candidate) {
    return false;
  }

  const normalizedProject = projectSlug.trim().toLowerCase();
  const compactProject = normalizedProject.replace(/[^a-z0-9]+/g, '');
  const compactCandidate = candidate.replace(/[^a-z0-9]+/g, '');
  if (candidate === normalizedProject || compactCandidate === compactProject) {
    return true;
  }

  const variants = Array.from(
    new Set([
      normalizedProject,
      normalizedProject.replace(/-/g, '_'),
      normalizedProject.replace(/_/g, '-'),
      ...normalizedProject.split(/[_-]+/g).filter((token) => token.length >= 4)
    ])
  );

  return variants.some((variant) => {
    const compactVariant = variant.replace(/[^a-z0-9]+/g, '');
    if (!compactVariant) {
      return false;
    }
    return (
      candidate.startsWith(`${variant}_`) ||
      candidate.startsWith(`${variant}-`) ||
      candidate.endsWith(`_${variant}`) ||
      candidate.endsWith(`-${variant}`) ||
      candidate.includes(`_${variant}_`) ||
      candidate.includes(`-${variant}-`) ||
      compactCandidate.includes(compactVariant)
    );
  });
};

const normalizeBlockDeviceCandidates = (value: string): string[] => {
  const raw = value.trim().toLowerCase();
  if (!raw) {
    return [];
  }

  const candidates = new Set<string>();
  const push = (candidate: string): void => {
    const normalized = slugify(candidate);
    if (normalized && normalized !== 'unknown') {
      candidates.add(normalized);
    }
  };

  const baseName = raw
    .replace(/\[[^\]]+\]/g, '')
    .replace(/^.*\//g, '')
    .trim();
  if (!baseName) {
    return [];
  }

  push(baseName);

  const queue = [baseName];
  while (queue.length > 0) {
    const current = queue.pop() ?? '';
    const patterns = [/^(.+)-part\d+$/, /^(nvme\d+n\d+)p\d+$/, /^(mmcblk\d+)p\d+$/, /^([a-z]+[a-z0-9]*)\d+$/];
    for (const pattern of patterns) {
      const match = current.match(pattern);
      if (!match?.[1]) {
        continue;
      }

      const normalized = slugify(match[1]);
      if (!candidates.has(normalized)) {
        push(match[1]);
        queue.push(match[1]);
      }
    }
  }

  return Array.from(candidates);
};

const filesystemNameFromSlug = (slug: string): string => {
  if (slug === 'root') {
    return '/';
  }
  return `/${slug.replace(/_/g, '/')}`;
};

const toDisplayName = (value: string): string =>
  value
    .split('_')
    .filter(Boolean)
    .map(capitalize)
    .join(' ');

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

const slugify = (value: string): string => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return 'unknown';
  }
  if (trimmed === '/') {
    return 'root';
  }
  return trimmed
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'unknown';
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const formatTimeLabel = (timestamp: string): string => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
};

const formatDateTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'Unavailable';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
};

const humanizeUptime = (totalSeconds: number): string => {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
};

const formatStorageBytes = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  const digits = exponent === 0 ? 0 : exponent >= 4 ? 1 : 0;

  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })} ${units[exponent]}`;
};

const formatLinkMeta = (speedMbps: number | undefined): string =>
  speedMbps !== undefined && Number.isFinite(speedMbps) && speedMbps > 0 ? `${Math.round(speedMbps)} Mbit/s` : '';

const normalizeInterfaceName = (value: string): string => value.trim().toLowerCase();
