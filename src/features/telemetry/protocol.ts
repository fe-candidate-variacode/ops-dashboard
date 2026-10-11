import { NODE_STATUSES } from './types';
import type { NodeMetric, NodeStatus, ServerMessage } from './types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isNodeStatus = (value: unknown): value is NodeStatus =>
  typeof value === 'string' && (NODE_STATUSES as readonly string[]).includes(value);

export function isNodeMetric(value: unknown): value is NodeMetric {
  return (
    isRecord(value) &&
    typeof value.nodeId === 'string' &&
    value.nodeId.length > 0 &&
    isNodeStatus(value.status) &&
    isFiniteNumber(value.cpu) &&
    isFiniteNumber(value.memory) &&
    isFiniteNumber(value.latencyMs) &&
    isFiniteNumber(value.timestamp)
  );
}

/**
 * Lightweight runtime validation of an incoming frame. Malformed frames yield
 * `null`; malformed node entries inside an otherwise valid frame are dropped so
 * one bad record cannot discard the whole batch.
 */
export function parseServerMessage(raw: string): ServerMessage | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(data) || !Array.isArray(data.nodes)) return null;
  if (data.type !== 'snapshot' && data.type !== 'update') return null;

  return { type: data.type, nodes: data.nodes.filter(isNodeMetric) };
}
