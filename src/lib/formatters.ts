const EMPTY = '—';

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatLatency(ms: number | null): string {
  return ms === null ? EMPTY : `${Math.round(ms)} ms`;
}
