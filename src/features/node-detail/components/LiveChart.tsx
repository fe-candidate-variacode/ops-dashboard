import { buildLineGeometry } from '../../../lib/chart';
import styles from './LiveChart.module.css';

const WIDTH = 300;
const HEIGHT = 80;

interface LiveChartProps {
  title: string;
  values: readonly number[];
  /** How many samples fill the full width. */
  capacity: number;
  /** Fixed y-axis range. */
  domain: readonly [number, number];
  format: (value: number) => string;
}

export function LiveChart({ title, values, capacity, domain, format }: LiveChartProps) {
  const [min, max] = domain;
  const { line, area } = buildLineGeometry(values, {
    width: WIDTH,
    height: HEIGHT,
    capacity,
    min,
    max,
  });

  const current = values[values.length - 1];
  const low = values.length > 0 ? Math.min(...values) : null;
  const high = values.length > 0 ? Math.max(...values) : null;

  const summary =
    current === undefined || low === null || high === null
      ? `${title}: collecting data`
      : `${title} over the last ${values.length} samples: now ${format(current)}, min ${format(low)}, max ${format(high)}`;

  return (
    <figure className={styles.figure}>
      <div className={styles.header} aria-hidden="true">
        <span className={styles.title}>{title}</span>
        <span className={styles.current}>{current === undefined ? '—' : format(current)}</span>
      </div>
      <svg
        role="img"
        aria-label={summary}
        className={styles.svg}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
      >
        <path d={area} className={styles.area} />
        <path d={line} className={styles.line} />
      </svg>
      <figcaption className={styles.range} aria-hidden="true">
        {low === null || high === null
          ? 'Collecting data…'
          : `min ${format(low)} · max ${format(high)}`}
      </figcaption>
    </figure>
  );
}
