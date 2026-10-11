const EMPTY = '—';

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatLatency(ms: number | null): string {
  return ms === null ? EMPTY : `${Math.round(ms)} ms`;
}

const TIME_FORMAT = new Intl.DateTimeFormat('en-GB', { timeStyle: 'medium', hour12: false });

export function formatTime(epochMs: number): string {
  return TIME_FORMAT.format(epochMs);
}
