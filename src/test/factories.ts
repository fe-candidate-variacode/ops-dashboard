import type { NodeMetric } from '../features/telemetry/types';

export function makeNode(overrides: Partial<NodeMetric> = {}): NodeMetric {
  return {
    nodeId: 'node-001',
    status: 'OK',
    cpu: 40,
    memory: 50,
    latencyMs: 100,
    timestamp: 1_700_000_000_000,
    ...overrides,
  };
}
