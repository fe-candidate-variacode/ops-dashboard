import { makeNode } from '../../test/factories';
import { HISTORY_CAPACITY, createTelemetryStore } from './telemetryStore';

describe('telemetry store', () => {
  it('applies a batch of nodes by id', () => {
    const store = createTelemetryStore();

    store.getState().applyBatch({
      replace: true,
      nodes: [makeNode({ nodeId: 'a' }), makeNode({ nodeId: 'b' })],
    });

    expect(Object.keys(store.getState().nodesById).sort()).toEqual(['a', 'b']);
  });

  it('merges updates into existing nodes without dropping the others', () => {
    const store = createTelemetryStore();
    store.getState().applyBatch({
      replace: true,
      nodes: [makeNode({ nodeId: 'a', cpu: 10 }), makeNode({ nodeId: 'b', cpu: 10 })],
    });

    store.getState().applyBatch({ replace: false, nodes: [makeNode({ nodeId: 'a', cpu: 80 })] });

    expect(store.getState().nodesById['a']?.cpu).toBe(80);
    expect(store.getState().nodesById['b']?.cpu).toBe(10);
  });

  it('replaces all nodes and history when the batch comes from a snapshot', () => {
    const store = createTelemetryStore();
    store.getState().applyBatch({ replace: true, nodes: [makeNode({ nodeId: 'old' })] });

    store.getState().applyBatch({ replace: true, nodes: [makeNode({ nodeId: 'new' })] });

    expect(Object.keys(store.getState().nodesById)).toEqual(['new']);
    expect(Object.keys(store.getState().history)).toEqual(['new']);
  });

  it('records history per node and caps it at the configured capacity', () => {
    const store = createTelemetryStore();

    for (let i = 0; i < HISTORY_CAPACITY + 10; i += 1) {
      store.getState().applyBatch({
        replace: false,
        nodes: [makeNode({ nodeId: 'a', cpu: i, timestamp: i })],
      });
    }

    const points = store.getState().history['a']?.toArray() ?? [];
    expect(points).toHaveLength(HISTORY_CAPACITY);
    expect(points[0]?.cpu).toBe(10);
    expect(points.at(-1)?.cpu).toBe(HISTORY_CAPACITY + 9);
  });

  it('notifies subscribers once per batch, however many nodes it holds', () => {
    const store = createTelemetryStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.getState().applyBatch({
      replace: false,
      nodes: Array.from({ length: 200 }, (_, i) => makeNode({ nodeId: `n-${i}` })),
    });

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
