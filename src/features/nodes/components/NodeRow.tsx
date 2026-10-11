import { memo } from 'react';
import { formatLatency, formatPercent } from '../../../lib/formatters';
import { NodeStatusBadge } from '../../telemetry/components/NodeStatusBadge';
import type { NodeId, NodeMetric } from '../../telemetry/types';
import styles from './NodeRow.module.css';

interface NodeRowProps {
  node: NodeMetric;
  selected: boolean;
  onSelect: (nodeId: NodeId) => void;
}

/**
 * Memoised: the store keeps the same node reference when nothing changed and
 * `onSelect` is stable, so only rows with new data or a selection change re-render.
 */
export const NodeRow = memo(function NodeRow({ node, selected, onSelect }: NodeRowProps) {
  return (
    <tr className={styles.row} data-status={node.status} data-selected={selected}>
      <th scope="row">
        <button
          type="button"
          className={styles.select}
          aria-expanded={selected}
          aria-controls="node-detail"
          onClick={() => onSelect(node.nodeId)}
        >
          {node.nodeId}
        </button>
      </th>
      <td>
        <NodeStatusBadge status={node.status} />
      </td>
      <td data-align="end">{formatPercent(node.cpu)}</td>
      <td data-align="end">{formatPercent(node.memory)}</td>
      <td data-align="end">{formatLatency(node.latencyMs)}</td>
    </tr>
  );
});
