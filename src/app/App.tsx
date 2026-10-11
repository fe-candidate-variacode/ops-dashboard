import { useMemo } from 'react';
import { TelemetryStatus } from '../features/telemetry/components/TelemetryStatus';
import { computeAggregates } from '../features/telemetry/aggregates';
import { useTelemetryStore } from '../features/telemetry/telemetryStore';

export function App() {
  const nodesById = useTelemetryStore((state) => state.nodesById);
  const aggregates = useMemo(() => computeAggregates(Object.values(nodesById)), [nodesById]);

  return (
    <main>
      <h1>Fleet Operations Dashboard</h1>
      <TelemetryStatus />
      <p>
        {aggregates.total} nodes · {aggregates.critical} critical
      </p>
    </main>
  );
}
