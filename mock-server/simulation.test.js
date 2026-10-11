import { describe, expect, it } from 'vitest';
import { createSimulation, deriveStatus } from './simulation.js';

const fixedNow = () => 1_700_000_000_000;
const options = { nodeCount: 200, seed: 20240611, now: fixedNow };

describe('deriveStatus', () => {
  it('is OK below every warning threshold', () => {
    expect(deriveStatus({ cpu: 40, memory: 50, latencyMs: 100 })).toBe('OK');
  });

  it('is WARNING when any metric crosses its warning threshold', () => {
    expect(deriveStatus({ cpu: 70, memory: 10, latencyMs: 10 })).toBe('WARNING');
    expect(deriveStatus({ cpu: 10, memory: 75, latencyMs: 10 })).toBe('WARNING');
    expect(deriveStatus({ cpu: 10, memory: 10, latencyMs: 250 })).toBe('WARNING');
  });

  it('is CRITICAL when any metric crosses its critical threshold, even if others are healthy', () => {
    expect(deriveStatus({ cpu: 90, memory: 10, latencyMs: 10 })).toBe('CRITICAL');
    expect(deriveStatus({ cpu: 10, memory: 92, latencyMs: 10 })).toBe('CRITICAL');
    expect(deriveStatus({ cpu: 10, memory: 10, latencyMs: 600 })).toBe('CRITICAL');
  });
});

describe('createSimulation', () => {
  it('is deterministic for a given seed', () => {
    const a = createSimulation(options);
    const b = createSimulation(options);

    expect(a.snapshot()).toEqual(b.snapshot());
    expect(a.tick()).toEqual(b.tick());
  });

  it('produces a different stream for a different seed', () => {
    const a = createSimulation(options);
    const b = createSimulation({ ...options, seed: 7 });

    expect(a.snapshot()).not.toEqual(b.snapshot());
  });

  it('snapshots every node with a status consistent with its metrics', () => {
    const snapshot = createSimulation(options).snapshot();

    expect(snapshot).toHaveLength(200);
    expect(new Set(snapshot.map((n) => n.nodeId)).size).toBe(200);
    for (const node of snapshot) {
      expect(node.status).toBe(deriveStatus(node));
    }
  });

  it('only reports nodes that changed in a tick', () => {
    const simulation = createSimulation(options);

    const changed = simulation.tick();

    expect(changed.length).toBeGreaterThan(0);
    expect(changed.length).toBeLessThan(200);
  });

  it('always has CRITICAL nodes available with the default seed', () => {
    const simulation = createSimulation(options);
    expect(simulation.snapshot().filter((n) => n.status === 'CRITICAL').length).toBeGreaterThan(0);

    const latest = new Map(simulation.snapshot().map((n) => [n.nodeId, n]));
    for (let tick = 0; tick < 300; tick += 1) {
      for (const node of simulation.tick()) latest.set(node.nodeId, node);
      const critical = [...latest.values()].filter((n) => n.status === 'CRITICAL');
      expect(critical.length).toBeGreaterThan(0);
    }
  });

  it('keeps metrics within valid ranges', () => {
    const simulation = createSimulation(options);
    for (let tick = 0; tick < 100; tick += 1) {
      for (const node of simulation.tick()) {
        expect(node.cpu).toBeGreaterThanOrEqual(0);
        expect(node.cpu).toBeLessThanOrEqual(100);
        expect(node.memory).toBeGreaterThanOrEqual(0);
        expect(node.memory).toBeLessThanOrEqual(100);
        expect(node.latencyMs).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
