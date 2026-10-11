export type NodeId = string;

export const NODE_STATUSES = ['OK', 'WARNING', 'CRITICAL'] as const;
export type NodeStatus = (typeof NODE_STATUSES)[number];

export interface NodeMetric {
  nodeId: NodeId;
  status: NodeStatus;
  /** Percentage, 0-100. */
  cpu: number;
  /** Percentage, 0-100. */
  memory: number;
  latencyMs: number;
  /** Epoch milliseconds, set by the server. */
  timestamp: number;
}

export interface HistoryPoint {
  timestamp: number;
  cpu: number;
  memory: number;
  latencyMs: number;
}

export type ServerMessage =
  { type: 'snapshot'; nodes: NodeMetric[] } | { type: 'update'; nodes: NodeMetric[] };

/** What the buffer hands to the store on each flush. */
export interface TelemetryBatch {
  nodes: NodeMetric[];
  /** True when the batch comes from a snapshot: previous state must be discarded. */
  replace: boolean;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'closed';
