import { memo } from 'react';
import { formatLatency, formatPercent } from '../../../lib/formatters';
import type { NodeMetric } from '../../telemetry/types';
import { NodeStatusBadge } from './NodeStatusBadge';
import styles from './NodeRow.module.css';

/**
 * Memoised on the node object: the store keeps the same reference for nodes
 * that did not change, so only rows with new data re-render on each flush.
 */
export const NodeRow = memo(function NodeRow({ node }: { node: NodeMetric }) {
  return (
    <tr className={styles.row} data-status={node.status}>
      <th scope="row">{node.nodeId}</th>
      <td>
        <NodeStatusBadge status={node.status} />
      </td>
      <td data-align="end">{formatPercent(node.cpu)}</td>
      <td data-align="end">{formatPercent(node.memory)}</td>
      <td data-align="end">{formatLatency(node.latencyMs)}</td>
    </tr>
  );
});
