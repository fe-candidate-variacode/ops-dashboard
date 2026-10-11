import { NodesPanel } from '../features/nodes/components/NodesPanel';
import { Overview } from '../features/overview/Overview';
import { TelemetryStatus } from '../features/telemetry/components/TelemetryStatus';
import styles from './App.module.css';

export function App() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.title}>Fleet Operations Dashboard</h1>
        <TelemetryStatus />
      </header>
      <main className={styles.main}>
        <Overview />
        <NodesPanel />
      </main>
    </div>
  );
}
