import { makeNode } from '../../test/factories';
import { parseServerMessage } from './protocol';

describe('parseServerMessage', () => {
  it('parses a valid snapshot and update', () => {
    const node = makeNode();

    expect(parseServerMessage(JSON.stringify({ type: 'snapshot', nodes: [node] }))).toEqual({
      type: 'snapshot',
      nodes: [node],
    });
    expect(parseServerMessage(JSON.stringify({ type: 'update', nodes: [node] }))?.type).toBe(
      'update',
    );
  });

  it('returns null for invalid JSON', () => {
    expect(parseServerMessage('{not json')).toBeNull();
  });

  it('returns null for unknown message types or a missing nodes array', () => {
    expect(parseServerMessage(JSON.stringify({ type: 'hello', nodes: [] }))).toBeNull();
    expect(parseServerMessage(JSON.stringify({ type: 'update' }))).toBeNull();
    expect(parseServerMessage('null')).toBeNull();
  });

  it('drops malformed node entries but keeps the valid ones', () => {
    const good = makeNode({ nodeId: 'node-002' });
    const raw = JSON.stringify({
      type: 'update',
      nodes: [
        good,
        { nodeId: 'x', status: 'BROKEN', cpu: 1, memory: 1, latencyMs: 1, timestamp: 1 },
        42,
      ],
    });

    expect(parseServerMessage(raw)?.nodes).toEqual([good]);
  });

  it('rejects non-finite or non-numeric metrics', () => {
    const raw = JSON.stringify({ type: 'update', nodes: [{ ...makeNode(), cpu: 'high' }] });

    expect(parseServerMessage(raw)?.nodes).toEqual([]);
  });
});
