import { makeNode } from '../../test/factories';
import { DEFAULT_SORT, filterByStatus, nextSort, selectVisibleNodes, sortNodes } from './nodesView';

const fleet = [
  makeNode({ nodeId: 'node-003', status: 'OK', cpu: 20, memory: 30, latencyMs: 90 }),
  makeNode({ nodeId: 'node-001', status: 'CRITICAL', cpu: 95, memory: 40, latencyMs: 700 }),
  makeNode({ nodeId: 'node-002', status: 'WARNING', cpu: 75, memory: 80, latencyMs: 300 }),
  makeNode({ nodeId: 'node-004', status: 'CRITICAL', cpu: 95, memory: 99, latencyMs: 650 }),
];

const ids = (nodes: { nodeId: string }[]) => nodes.map((n) => n.nodeId);

describe('filterByStatus', () => {
  it('keeps every node for ALL', () => {
    expect(filterByStatus(fleet, 'ALL')).toHaveLength(4);
  });

  it('keeps only nodes with the requested status', () => {
    expect(ids(filterByStatus(fleet, 'CRITICAL'))).toEqual(['node-001', 'node-004']);
  });
});

describe('sortNodes', () => {
  it('sorts by a metric descending', () => {
    expect(ids(sortNodes(fleet, { key: 'latencyMs', order: 'desc' }))).toEqual([
      'node-001',
      'node-004',
      'node-002',
      'node-003',
    ]);
  });

  it('sorts by a metric ascending', () => {
    expect(ids(sortNodes(fleet, { key: 'memory', order: 'asc' }))[0]).toBe('node-003');
  });

  it('breaks ties by node id so the order is stable', () => {
    expect(ids(sortNodes(fleet, { key: 'cpu', order: 'desc' })).slice(0, 2)).toEqual([
      'node-001',
      'node-004',
    ]);
  });

  it('orders by severity with critical first when descending', () => {
    expect(sortNodes(fleet, { key: 'status', order: 'desc' })[0]?.status).toBe('CRITICAL');
    expect(sortNodes(fleet, { key: 'status', order: 'desc' }).at(-1)?.status).toBe('OK');
  });

  it('does not mutate its input', () => {
    const copy = [...fleet];
    sortNodes(fleet, { key: 'cpu', order: 'asc' });
    expect(fleet).toEqual(copy);
  });
});

describe('nextSort', () => {
  it('starts a new metric column at its worst-first order', () => {
    expect(nextSort(DEFAULT_SORT, 'cpu')).toEqual({ key: 'cpu', order: 'desc' });
  });

  it('flips the order when the active column is chosen again', () => {
    expect(nextSort({ key: 'cpu', order: 'desc' }, 'cpu')).toEqual({ key: 'cpu', order: 'asc' });
    expect(nextSort({ key: 'cpu', order: 'asc' }, 'cpu')).toEqual({ key: 'cpu', order: 'desc' });
  });

  it('starts the node column in A-Z order', () => {
    expect(nextSort({ key: 'cpu', order: 'desc' }, 'nodeId')).toEqual({
      key: 'nodeId',
      order: 'asc',
    });
  });
});

describe('selectVisibleNodes', () => {
  it('filters and then sorts', () => {
    const result = selectVisibleNodes(fleet, 'CRITICAL', { key: 'memory', order: 'desc' });

    expect(ids(result)).toEqual(['node-004', 'node-001']);
  });
});
