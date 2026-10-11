import { useState } from 'react';
import { NodeDetailPanel } from '../features/node-detail/components/NodeDetailPanel';
import { NodesPanel } from '../features/nodes/components/NodesPanel';
import { Overview } from '../features/overview/Overview';
import { TelemetryStatus } from '../features/telemetry/components/TelemetryStatus';
import type { NodeId } from '../features/telemetry/types';
import styles from './App.module.css';

export function App() {
  // Selection is plain UI state owned by the shell, which wires the two features
  // together; the telemetry stream never re-renders this component.
  const [selectedNodeId, setSelectedNodeId] = useState<NodeId | null>(null);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.title}>Fleet Operations Dashboard</h1>
        <TelemetryStatus />
      </header>
      <main className={styles.main}>
        <Overview />
        <div className={styles.content}>
          <NodesPanel selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} />
          <div className={styles.detail}>
            <NodeDetailPanel nodeId={selectedNodeId} onClose={() => setSelectedNodeId(null)} />
          </div>
        </div>
      </main>
    </div>
  );
}
