import { useDeferredValue, useMemo } from 'react';
import { Button, Card, Select, SortableHeader, Table } from '../../../design-system';
import type { SelectOption, SortDirection } from '../../../design-system';
import { useTelemetryStore } from '../../telemetry/telemetryStore';
import type { NodeId } from '../../telemetry/types';
import { selectVisibleNodes } from '../nodesView';
import type { SortKey, StatusFilter } from '../nodesView';
import { useNodesViewStore } from '../nodesViewStore';
import { NodeRow } from './NodeRow';
import styles from './NodesPanel.module.css';

const FILTER_OPTIONS: readonly SelectOption<StatusFilter>[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'WARNING', label: 'Warning' },
  { value: 'OK', label: 'OK' },
];

const SORTABLE_COLUMNS: readonly { key: SortKey; label: string; align: 'start' | 'end' }[] = [
  { key: 'cpu', label: 'CPU', align: 'end' },
  { key: 'memory', label: 'Memory', align: 'end' },
  { key: 'latencyMs', label: 'Latency', align: 'end' },
];

interface NodesPanelProps {
  selectedNodeId: NodeId | null;
  onSelectNode: (nodeId: NodeId) => void;
}

export function NodesPanel({ selectedNodeId, onSelectNode }: NodesPanelProps) {
  const nodesById = useTelemetryStore((state) => state.nodesById);
  const statusFilter = useNodesViewStore((state) => state.statusFilter);
  const sort = useNodesViewStore((state) => state.sort);
  const setStatusFilter = useNodesViewStore((state) => state.setStatusFilter);
  const toggleSort = useNodesViewStore((state) => state.toggleSort);

  // Controls update immediately; the (heavier) list follows at lower priority
  // so interacting never waits on rendering the table.
  const deferredFilter = useDeferredValue(statusFilter);
  const deferredSort = useDeferredValue(sort);

  const allNodes = useMemo(() => Object.values(nodesById), [nodesById]);
  const visibleNodes = useMemo(
    () => selectVisibleNodes(allNodes, deferredFilter, deferredSort),
    [allNodes, deferredFilter, deferredSort],
  );

  const directionFor = (key: SortKey): SortDirection | null =>
    sort.key !== key ? null : sort.order === 'asc' ? 'ascending' : 'descending';

  return (
    <Card as="section" aria-labelledby="nodes-heading">
      <div className={styles.toolbar}>
        <h2 id="nodes-heading" className={styles.heading}>
          Nodes
        </h2>
        <Select
          label="Status"
          value={statusFilter}
          options={FILTER_OPTIONS}
          onChange={setStatusFilter}
        />
        <p className={styles.count}>
          Showing {visibleNodes.length} of {allNodes.length} nodes
        </p>
      </div>

      {visibleNodes.length === 0 ? (
        <div className={styles.empty}>
          <p>{allNodes.length === 0 ? 'Waiting for telemetry…' : 'No nodes match this filter.'}</p>
          {allNodes.length > 0 && (
            <Button onClick={() => setStatusFilter('ALL')}>Show all nodes</Button>
          )}
        </div>
      ) : (
        <Table caption="Fleet nodes">
          <thead>
            <tr>
              <SortableHeader
                direction={directionFor('nodeId')}
                onSort={() => toggleSort('nodeId')}
              >
                Node
              </SortableHeader>
              <SortableHeader
                direction={directionFor('status')}
                onSort={() => toggleSort('status')}
              >
                Status
              </SortableHeader>
              {SORTABLE_COLUMNS.map((column) => (
                <SortableHeader
                  key={column.key}
                  align={column.align}
                  direction={directionFor(column.key)}
                  onSort={() => toggleSort(column.key)}
                >
                  {column.label}
                </SortableHeader>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleNodes.map((node) => (
              <NodeRow
                key={node.nodeId}
                node={node}
                selected={node.nodeId === selectedNodeId}
                onSelect={onSelectNode}
              />
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}
