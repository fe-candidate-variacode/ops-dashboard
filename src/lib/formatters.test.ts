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
