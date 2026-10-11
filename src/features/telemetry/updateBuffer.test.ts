import { makeNode } from '../../test/factories';
import { UpdateBuffer } from './updateBuffer';

describe('UpdateBuffer', () => {
  it('returns null when nothing is pending', () => {
    expect(new UpdateBuffer().drain()).toBeNull();
  });

  it('keeps only the latest value per node between drains', () => {
    const buffer = new UpdateBuffer();
    buffer.push({ type: 'update', nodes: [makeNode({ cpu: 10 })] });
    buffer.push({
      type: 'update',
      nodes: [makeNode({ cpu: 20 }), makeNode({ nodeId: 'node-002' })],
    });
    buffer.push({ type: 'update', nodes: [makeNode({ cpu: 30 })] });

    const batch = buffer.drain();

    expect(batch?.replace).toBe(false);
    expect(batch?.nodes).toHaveLength(2);
    expect(batch?.nodes.find((n) => n.nodeId === 'node-001')?.cpu).toBe(30);
  });

  it('is empty again after draining', () => {
    const buffer = new UpdateBuffer();
    buffer.push({ type: 'update', nodes: [makeNode()] });
    buffer.drain();

    expect(buffer.drain()).toBeNull();
  });

  it('marks the batch as a replacement and discards earlier updates on snapshot', () => {
    const buffer = new UpdateBuffer();
    buffer.push({ type: 'update', nodes: [makeNode({ nodeId: 'stale' })] });
    buffer.push({ type: 'snapshot', nodes: [makeNode({ nodeId: 'fresh' })] });
    buffer.push({ type: 'update', nodes: [makeNode({ nodeId: 'fresh', cpu: 99 })] });

    const batch = buffer.drain();

    expect(batch?.replace).toBe(true);
    expect(batch?.nodes.map((n) => n.nodeId)).toEqual(['fresh']);
    expect(batch?.nodes[0]?.cpu).toBe(99);
  });
});
