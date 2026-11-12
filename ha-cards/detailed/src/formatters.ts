const BINARY_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;
const NETWORK_UNITS = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps'] as const;

const formatNumber = (value: number, digits: number): string =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const formatPercent = (value: number, digits = 0): string => `${formatNumber(value, digits)}%`;

export const formatProjectPercent = (value: number): string => {
  const digits = value >= 10 ? 1 : value >= 1 ? 2 : 3;
  return `${formatNumber(value, digits)}%`;
};

export const formatContainerImage = (image: string): string =>
  image.replace(/(^|@)(sha256:[a-f0-9]{12})[a-f0-9]{52}$/i, '$1$2…');

export const formatBytes = (bytes: number, digits = 1): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), BINARY_UNITS.length - 1);
  const value = bytes / 1024 ** exponent;
  const decimals = exponent === 0 ? 0 : digits;

  return `${formatNumber(value, decimals)} ${BINARY_UNITS[exponent]}`;
};

export const formatStorage = (bytes: number): string => formatBytes(bytes, bytes >= 1024 ** 4 ? 1 : 0);

export const formatBitsPerSecond = (bitsPerSecond: number, digits = 1): string => {
  if (!Number.isFinite(bitsPerSecond) || bitsPerSecond <= 0) {
    return '0 bps';
  }

  const exponent = Math.min(Math.floor(Math.log(bitsPerSecond) / Math.log(1000)), NETWORK_UNITS.length - 1);
  const value = bitsPerSecond / 1000 ** exponent;
  const decimals = exponent === 0 ? 0 : digits;

  return `${formatNumber(value, decimals)} ${NETWORK_UNITS[exponent]}`;
};

export const formatBytesPerSecond = (bytesPerSecond: number, digits = 1): string =>
  `${formatBytes(bytesPerSecond, digits)}/s`;

export const formatUptime = (totalSeconds: number): string => {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return `${days}d ${hours}h ${minutes}m`;
};

export const formatTemperature = (temperatureCelsius: number): string => `${formatNumber(temperatureCelsius, 0)}°C`;

export const formatUsageOfTotal = (usedBytes: number, totalBytes: number): string =>
  `${formatStorage(usedBytes)} / ${formatStorage(totalBytes)}`;

export const toPercent = (part: number, total: number): number => (total > 0 ? (part / total) * 100 : 0);
