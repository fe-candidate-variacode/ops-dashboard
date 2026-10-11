import { useTelemetryStore } from '../telemetryStore';
import type { ConnectionStatus } from '../types';
import styles from './TelemetryStatus.module.css';

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connecting: 'Connecting',
  connected: 'Connected',
  reconnecting: 'Reconnecting',
  closed: 'Disconnected',
};

// State is conveyed by icon + text, never by colour alone.
const STATUS_ICON: Record<ConnectionStatus, string> = {
  connecting: '◌',
  connected: '●',
  reconnecting: '↻',
  closed: '○',
};

export function TelemetryStatus() {
  const status = useTelemetryStore((state) => state.connectionStatus);
  const updatesPerSecond = useTelemetryStore((state) => state.updatesPerSecond);

  return (
    <dl className={styles.root}>
      <div className={styles.item}>
        <dt>Connection</dt>
        <dd data-status={status}>
          <span aria-hidden="true">{STATUS_ICON[status]}</span> {STATUS_LABEL[status]}
        </dd>
      </div>
      <div className={styles.item}>
        <dt>Updates/s</dt>
        <dd>{updatesPerSecond}</dd>
      </div>
    </dl>
  );
}
