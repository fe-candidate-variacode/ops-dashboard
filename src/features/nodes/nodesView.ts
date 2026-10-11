import type { NodeMetric, NodeStatus } from '../telemetry/types';

export type StatusFilter = 'ALL' | NodeStatus;
export type SortKey = 'nodeId' | 'status' | 'cpu' | 'memory' | 'latencyMs';
export type SortOrder = 'asc' | 'desc';

export interface SortState {
  key: SortKey;
  order: SortOrder;
}

export const DEFAULT_SORT: SortState = { key: 'nodeId', order: 'asc' };

const SEVERITY: Record<NodeStatus, number> = { OK: 0, WARNING: 1, CRITICAL: 2 };

// Metrics start with the worst values on top; identifiers start A-Z.
const FIRST_ORDER: Record<SortKey, SortOrder> = {
  nodeId: 'asc',
  status: 'desc',
  cpu: 'desc',
  memory: 'desc',
  latencyMs: 'desc',
};

/** Clicking the active column flips the order; a new column starts at its natural order. */
export function nextSort(current: SortState, key: SortKey): SortState {
  if (current.key === key) {
    return { key, order: current.order === 'asc' ? 'desc' : 'asc' };
  }
  return { key, order: FIRST_ORDER[key] };
}

export function filterByStatus(nodes: readonly NodeMetric[], filter: StatusFilter): NodeMetric[] {
  return filter === 'ALL' ? [...nodes] : nodes.filter((node) => node.status === filter);
}

function compareBy(key: SortKey, a: NodeMetric, b: NodeMetric): number {
  switch (key) {
    case 'nodeId':
      return a.nodeId.localeCompare(b.nodeId);
    case 'status':
      return SEVERITY[a.status] - SEVERITY[b.status];
    default:
      return a[key] - b[key];
  }
}

/** Returns a new array. Ties fall back to node id so the order is stable while the stream updates. */
export function sortNodes(nodes: readonly NodeMetric[], sort: SortState): NodeMetric[] {
  const direction = sort.order === 'asc' ? 1 : -1;
  return [...nodes].sort(
    (a, b) => compareBy(sort.key, a, b) * direction || a.nodeId.localeCompare(b.nodeId),
  );
}

export function selectVisibleNodes(
  nodes: readonly NodeMetric[],
  filter: StatusFilter,
  sort: SortState,
): NodeMetric[] {
  return sortNodes(filterByStatus(nodes, filter), sort);
}
