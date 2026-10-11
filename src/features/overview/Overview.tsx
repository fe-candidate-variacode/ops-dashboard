import { useShallow } from 'zustand/react/shallow';
import { Card, Stat } from '../../design-system';
import { formatLatency } from '../../lib/formatters';
import { selectAggregates } from '../telemetry/selectors';
import { useTelemetryStore } from '../telemetry/telemetryStore';
import styles from './Overview.module.css';

export function Overview() {
  const { total, critical, averageLatencyMs } = useTelemetryStore(useShallow(selectAggregates));

  return (
    <section aria-label="Fleet overview" className={styles.grid}>
      <Card>
        <Stat label="Total Active Nodes" value={total} />
      </Card>
      <Card>
        <Stat
          label="Critical Alerts"
          value={critical}
          tone={critical > 0 ? 'critical' : 'default'}
        />
      </Card>
      <Card>
        <Stat label="Average System Latency" value={formatLatency(averageLatencyMs)} />
      </Card>
    </section>
  );
}
