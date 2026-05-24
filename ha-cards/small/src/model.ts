import {
  formatBitsPerSecond,
  formatPercent,
  formatStorage,
  formatTemperature,
  formatUsageOfTotal,
  toPercent
} from '../../detailed/src/formatters';
import { createEmptyDashboardModel, fakeDashboardModel } from '../../detailed/src/model';
import { THEME_COLORS } from '../../detailed/src/theme';
import type {
  LoadSummaryCard,
  MemorySummaryCard,
  NasDashboardModel,
  UtilizationSummaryCard
} from '../../detailed/src/types';
import type { MetricTile, MiniDataMode, NasMiniDashboardModel, UgreenNasMiniCardConfig } from './types';

const isUtilizationSummary = (summary: NasDashboardModel['hardwareSummary'][number]): summary is UtilizationSummaryCard =>
  summary.kind === 'cpu' || summary.kind === 'gpu';

const isMemorySummary = (summary: NasDashboardModel['hardwareSummary'][number]): summary is MemorySummaryCard =>
  summary.kind === 'ram';

const isLoadSummary = (summary: NasDashboardModel['hardwareSummary'][number]): summary is LoadSummaryCard =>
  summary.kind === 'system-load';

const clampProgress = (value: number): number => Math.max(0, Math.min(1, value));

const buildVolumeGroups = (
  model: NasDashboardModel
): Record<'nvme' | 'sata', { totalBytes: number; usedBytes: number }> => {
  const driveCapacityByMedia = model.drives.reduce<Record<'nvme' | 'sata', number>>(
    (totals, drive) => {
      if (drive.mediaType === 'nvme') {
        totals.nvme += drive.capacityBytes;
      } else if (drive.mediaType === 'hdd') {
        totals.sata += drive.capacityBytes;
      }
      return totals;
    },
    { nvme: 0, sata: 0 }
  );

  const groups: Record<'nvme' | 'sata', { totalBytes: number; usedBytes: number }> = {
    nvme: { totalBytes: 0, usedBytes: 0 },
    sata: { totalBytes: 0, usedBytes: 0 }
  };

  const unresolvedPools = [...model.storagePools];
  for (const pool of model.storagePools) {
    const media = classifyPoolMedia(pool.name, pool.layout);
    if (!media) {
      continue;
    }

    groups[media].totalBytes += pool.totalBytes;
    groups[media].usedBytes += pool.usedBytes;
    unresolvedPools.splice(unresolvedPools.indexOf(pool), 1);
  }

  for (const pool of unresolvedPools) {
    const media = resolvePoolMediaByCapacity(pool.totalBytes, driveCapacityByMedia, groups);
    groups[media].totalBytes += pool.totalBytes;
    groups[media].usedBytes += pool.usedBytes;
  }

  return groups;
};

const classifyPoolMedia = (name: string, layout: string): 'nvme' | 'sata' | null => {
  const text = `${name} ${layout}`.toLowerCase();
  if (text.includes('nvme') || text.includes('m.2') || text.includes('ssd')) {
    return 'nvme';
  }
  if (text.includes('sata') || text.includes('hdd')) {
    return 'sata';
  }
  return null;
};

const resolvePoolMediaByCapacity = (
  poolTotalBytes: number,
  driveCapacityByMedia: Record<'nvme' | 'sata', number>,
  assignedGroups: Record<'nvme' | 'sata', { totalBytes: number; usedBytes: number }>
): 'nvme' | 'sata' => {
  const candidates = (['nvme', 'sata'] as const)
    .filter((media) => driveCapacityByMedia[media] > 0)
    .map((media) => ({
      media,
      distance: Math.abs((driveCapacityByMedia[media] - assignedGroups[media].totalBytes) - poolTotalBytes)
    }))
    .sort((left, right) => left.distance - right.distance);

  return candidates[0]?.media ?? 'sata';
};

const buildVolumeTile = (
  id: 'nvme' | 'sata',
  label: string,
  accent: string,
  totalBytes: number,
  usedBytes: number
): MetricTile => {
  const progress = totalBytes > 0 ? clampProgress(toPercent(usedBytes, totalBytes) / 100) : 0;
  return {
    id,
    label,
    icon: 'database',
    accent,
    value: formatStorage(totalBytes),
    secondary: totalBytes > 0 ? formatUsageOfTotal(usedBytes, totalBytes) : 'Unavailable',
    progress
  };
};

const buildNetworkTile = (model: NasDashboardModel): MetricTile => {
  const interfaces = model.networkInterfaces.map((iface) => iface.name);
  const downloadBps = model.networkInterfaces.reduce((total, iface) => total + iface.downloadBps, 0);
  const uploadBps = model.networkInterfaces.reduce((total, iface) => total + iface.uploadBps, 0);
  const upCount = model.networkInterfaces.filter((iface) => iface.status === 'up').length;
  const totalCount = model.networkInterfaces.length;

  return {
    id: 'network',
    label: 'Network State',
    icon: 'network',
    accent: THEME_COLORS.softBlue,
    value: totalCount > 0 ? `${upCount}/${totalCount} Up` : 'Unavailable',
    secondary: interfaces.length > 0 ? interfaces.join(' | ') : 'No interfaces',
    down: formatBitsPerSecond(downloadBps),
    up: formatBitsPerSecond(uploadBps)
  };
};

const buildStatusMeta = (mode: MiniDataMode): { label: string; color: string } => {
  switch (mode) {
    case 'live':
      return { label: 'Online', color: 'var(--ugreen-green)' };
    case 'missing':
      return { label: 'No Data', color: '#ffd84d' };
    default:
      return { label: 'Preview', color: 'var(--ugreen-soft-blue)' };
  }
};

export const buildMiniDashboardModel = (
  model: NasDashboardModel,
  mode: MiniDataMode,
  config?: UgreenNasMiniCardConfig
): NasMiniDashboardModel => {
  const cpu = model.hardwareSummary.filter(isUtilizationSummary).find((summary) => summary.kind === 'cpu');
  const ram = model.hardwareSummary.filter(isMemorySummary).find((summary) => summary.kind === 'ram');
  const gpu = model.hardwareSummary.filter(isUtilizationSummary).find((summary) => summary.kind === 'gpu');
  const load = model.hardwareSummary.filter(isLoadSummary).find((summary) => summary.kind === 'system-load');
  const status = buildStatusMeta(mode);
  const volumes = buildVolumeGroups(model);

  const metricTiles: MetricTile[] = [
    {
      id: 'cpu',
      label: 'CPU',
      icon: 'chip',
      accent: THEME_COLORS.blue,
      value: formatPercent(cpu?.valuePercent ?? 0),
      secondary: cpu ? formatTemperature(cpu.temperatureCelsius) : 'Unavailable',
      progress: clampProgress((cpu?.valuePercent ?? 0) / 100)
    },
    {
      id: 'ram',
      label: 'RAM',
      icon: 'memory',
      accent: THEME_COLORS.purple,
      value: formatPercent(ram?.valuePercent ?? 0),
      secondary: ram ? formatUsageOfTotal(ram.usedBytes, ram.totalBytes) : 'Unavailable',
      progress: clampProgress((ram?.valuePercent ?? 0) / 100)
    },
    {
      id: 'gpu',
      label: 'GPU',
      icon: 'gpu',
      accent: THEME_COLORS.green,
      value: gpu ? formatPercent(gpu.valuePercent) : 'N/A',
      secondary: gpu ? formatTemperature(gpu.temperatureCelsius) : 'Unavailable',
      progress: clampProgress((gpu?.valuePercent ?? 0) / 100)
    },
    {
      id: 'systemLoad',
      label: 'Load',
      icon: 'pulse',
      accent: THEME_COLORS.softBlue,
      value: load?.valueText ?? '0.00',
      secondary: load?.statusText ?? 'Unavailable',
      progress: clampProgress((load?.valuePercent ?? 0) / 100)
    },
    buildVolumeTile('nvme', 'NVMe Volume', THEME_COLORS.cyan, volumes.nvme.totalBytes, volumes.nvme.usedBytes),
    buildVolumeTile('sata', 'SATA Volume', THEME_COLORS.green, volumes.sata.totalBytes, volumes.sata.usedBytes),
    buildNetworkTile(model)
  ];

  return {
    title: model.deviceInfo.model,
    statusLabel: status.label,
    statusColor: status.color,
    metricTiles
  };
};

export const previewMiniModel = (config?: UgreenNasMiniCardConfig): NasMiniDashboardModel =>
  buildMiniDashboardModel(fakeDashboardModel, 'preview', config);

export const emptyMiniModel = (config?: UgreenNasMiniCardConfig): NasMiniDashboardModel =>
  buildMiniDashboardModel(createEmptyDashboardModel(), 'missing', config);
