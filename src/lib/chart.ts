export interface LineGeometry {
  /** SVG path for the stroked line. Empty when there is no data. */
  line: string;
  /** Closed path under the line, for a subtle area fill. */
  area: string;
}

export interface LineOptions {
  width: number;
  height: number;
  /** Number of samples that fit across the full width; fewer samples hug the right edge. */
  capacity: number;
  min: number;
  max: number;
}

const round = (value: number) => Math.round(value * 10) / 10;

/**
 * Maps a series to SVG paths, newest sample pinned to the right edge so the
 * line visibly scrolls left as new data arrives. Values outside [min, max]
 * are clamped.
 */
export function buildLineGeometry(values: readonly number[], options: LineOptions): LineGeometry {
  const { width, height, capacity, min, max } = options;
  if (values.length === 0) return { line: '', area: '' };

  const step = capacity > 1 ? width / (capacity - 1) : 0;
  const span = max - min || 1;

  const points = values.map((value, index) => {
    const clamped = Math.min(max, Math.max(min, value));
    const x = width - (values.length - 1 - index) * step;
    const y = height - ((clamped - min) / span) * height;
    return `${round(x)} ${round(y)}`;
  });

  const first = points[0] as string;
  const lastX = round(width);
  const firstX = first.split(' ')[0];
  const line = `M ${points.join(' L ')}`;
  const area = `${line} L ${lastX} ${height} L ${firstX} ${height} Z`;

  return { line, area };
}

/** Domain for a series with no natural upper bound: starts at 0 and leaves headroom. */
export function autoDomain(values: readonly number[], minimumMax = 100): [number, number] {
  const peak = values.reduce((acc, value) => Math.max(acc, value), 0);
  const padded = Math.ceil((peak * 1.1) / 50) * 50;
  return [0, Math.max(minimumMax, padded)];
}
