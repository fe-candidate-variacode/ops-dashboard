import { useMemo } from 'react';
import { Button, Card } from '../../../design-system';
import { autoDomain } from '../../../lib/chart';
import { formatLatency, formatPercent, formatTime } from '../../../lib/formatters';
import { NodeStatusBadge } from '../../telemetry/components/NodeStatusBadge';
import { HISTORY_CAPACITY, useTelemetryStore } from '../../telemetry/telemetryStore';
import type { NodeId } from '../../telemetry/types';
import { LiveChart } from './LiveChart';
import styles from './NodeDetailPanel.module.css';

interface NodeDetailPanelProps {
  nodeId: NodeId | null;
  onClose: () => void;
}

/** Stable landmark: always rendered so selecting a node never shifts the layout. */
export function NodeDetailPanel({ nodeId, onClose }: NodeDetailPanelProps) {
  return (
    <Card as="section" aria-labelledby="node-detail-heading" id="node-detail">
      <h2 id="node-detail-heading" className={styles.heading}>
        Node detail
      </h2>
      {nodeId === null ? (
        <p className={styles.hint}>Select a node to see its live telemetry.</p>
      ) : (
        <NodeDetail nodeId={nodeId} onClose={onClose} />
      )}
    </Card>
  );
}

/**
 * Subscribes only to this node's entry and history. The store keeps the same
 * references for untouched nodes, so updates to other nodes do not re-render it.
 */
function NodeDetail({ nodeId, onClose }: { nodeId: NodeId; onClose: () => void }) {
  const node = useTelemetryStore((state) => state.nodesById[nodeId]);
  const ring = useTelemetryStore((state) => state.history[nodeId]);

  const cpuValues = useMemo(() => ring?.toArray().map((point) => point.cpu) ?? [], [ring]);
  const latencyValues = useMemo(
    () => ring?.toArray().map((point) => point.latencyMs) ?? [],
    [ring],
  );

  if (!node) {
    return (
      <div className={styles.missing}>
        <p>
          <strong>{nodeId}</strong> is no longer reporting.
        </p>
        <Button onClick={onClose}>Close</Button>
      </div>
    );
  }

  return (
    <div className={styles.body}>
      <div className={styles.titleRow}>
        <h3 className={styles.nodeId}>{node.nodeId}</h3>
        <NodeStatusBadge status={node.status} />
        <Button onClick={onClose}>Close</Button>
      </div>

      <dl className={styles.metrics}>
        <div>
          <dt>CPU</dt>
          <dd>{formatPercent(node.cpu)}</dd>
        </div>
        <div>
          <dt>Memory</dt>
          <dd>{formatPercent(node.memory)}</dd>
        </div>
        <div>
          <dt>Latency</dt>
          <dd>{formatLatency(node.latencyMs)}</dd>
        </div>
        <div>
          <dt>Last update</dt>
          <dd>{formatTime(node.timestamp)}</dd>
        </div>
      </dl>

      <LiveChart
        title="CPU"
        values={cpuValues}
        capacity={HISTORY_CAPACITY}
        domain={[0, 100]}
        format={formatPercent}
      />
      <LiveChart
        title="Latency"
        values={latencyValues}
        capacity={HISTORY_CAPACITY}
        domain={autoDomain(latencyValues)}
        format={formatLatency}
      />
    </div>
  );
}
