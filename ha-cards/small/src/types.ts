import type {
  CardConfig as DetailedCardConfig,
  FanSpeedReading,
  HomeAssistantLike as DetailedHomeAssistantLike
} from '../../detailed/src/types';

export type HomeAssistantLike = DetailedHomeAssistantLike;
export type UgreenNasMiniCardConfig = DetailedCardConfig;
export type MiniDataMode = 'preview' | 'missing' | 'live';

export interface MetricTile {
  id: 'cpu' | 'ram' | 'gpu' | 'systemLoad' | 'nvme' | 'sata' | 'network';
  label: string;
  icon: string;
  accent: string;
  value: string;
  secondary: string;
  progress?: number;
  fanSpeeds?: FanSpeedReading[];
  down?: string;
  up?: string;
}

export interface NasMiniDashboardModel {
  title: string;
  statusLabel: string;
  statusColor: string;
  metricTiles: MetricTile[];
}
