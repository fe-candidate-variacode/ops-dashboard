import { makeNode } from '../../test/factories';
import { computeAggregates } from './aggregates';

describe('computeAggregates', () => {
  it('counts nodes by status and averages latency', () => {
    const result = computeAggregates([
      makeNode({ nodeId: 'a', status: 'OK', latencyMs: 100 }),
      makeNode({ nodeId: 'b', status: 'WARNING', latencyMs: 200 }),
      makeNode({ nodeId: 'c', status: 'CRITICAL', latencyMs: 300 }),
      makeNode({ nodeId: 'd', status: 'CRITICAL', latencyMs: 400 }),
    ]);

    expect(result).toEqual({
      total: 4,
      ok: 1,
      warning: 1,
      critical: 2,
      averageLatencyMs: 250,
    });
  });

  it('has no average latency for an empty fleet', () => {
    expect(computeAggregates([])).toEqual({
      total: 0,
      ok: 0,
      warning: 0,
      critical: 0,
      averageLatencyMs: null,
    });
  });
});
