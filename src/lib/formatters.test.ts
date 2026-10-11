import { formatLatency, formatPercent } from './formatters';

describe('formatters', () => {
  it('formats percentages with one decimal', () => {
    expect(formatPercent(42)).toBe('42.0%');
    expect(formatPercent(7.26)).toBe('7.3%');
  });

  it('formats latency in whole milliseconds', () => {
    expect(formatLatency(123.4)).toBe('123 ms');
  });

  it('shows a placeholder when there is no latency yet', () => {
    expect(formatLatency(null)).toBe('—');
  });
});

describe('formatTime', () => {
  it('formats an epoch timestamp as HH:MM:SS', async () => {
    const { formatTime } = await import('./formatters');

    expect(formatTime(1_700_000_000_000)).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});
