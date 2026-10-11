import type { NodeMetric } from './types';

export interface FleetAggregates {
  total: number;
  ok: number;
  warning: number;
  critical: number;
  /** Mean latency across all nodes, or `null` when there are no nodes. */
  averageLatencyMs: number | null;
}

export function computeAggregates(nodes: Iterable<NodeMetric>): FleetAggregates {
  let total = 0;
  let ok = 0;
  let warning = 0;
  let critical = 0;
  let latencySum = 0;

  for (const node of nodes) {
    total += 1;
    latencySum += node.latencyMs;
    if (node.status === 'CRITICAL') critical += 1;
    else if (node.status === 'WARNING') warning += 1;
    else ok += 1;
  }

  return {
    total,
    ok,
    warning,
    critical,
    averageLatencyMs: total === 0 ? null : latencySum / total,
  };
}
