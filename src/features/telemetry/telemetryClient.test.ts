import { FakeSocket } from '../../test/fakeSocket';
import { makeNode } from '../../test/factories';
import { TelemetryClient } from './telemetryClient';
import type { ConnectionStatus, ServerMessage } from './types';

function setup() {
  const statuses: ConnectionStatus[] = [];
  const messages: ServerMessage[] = [];
  const client = new TelemetryClient({
    url: 'ws://test/ws',
    createSocket: (url) => new FakeSocket(url),
    backoff: { baseMs: 500, maxMs: 4000, factor: 2, jitter: 0 },
    onStatusChange: (status) => statuses.push(status),
    onMessage: (message) => messages.push(message),
  });
  return { client, statuses, messages };
}

describe('TelemetryClient', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeSocket.reset();
  });
  afterEach(() => vi.useRealTimers());

  it('reports connecting, then connected once the socket opens', () => {
    const { client, statuses } = setup();

    client.start();
    FakeSocket.latest().open();

    expect(statuses).toEqual(['connecting', 'connected']);
  });

  it('forwards valid messages and ignores malformed ones', () => {
    const { client, messages } = setup();
    client.start();
    const socket = FakeSocket.latest();
    socket.open();

    socket.receive({ type: 'update', nodes: [makeNode()] });
    socket.receive('garbage');

    expect(messages).toHaveLength(1);
    expect(messages[0]?.type).toBe('update');
  });

  it('reconnects with exponential backoff while the server stays down', () => {
    const { client, statuses } = setup();
    client.start();

    FakeSocket.latest().drop();
    expect(statuses.at(-1)).toBe('reconnecting');
    vi.advanceTimersByTime(499);
    expect(FakeSocket.instances).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(FakeSocket.instances).toHaveLength(2);

    FakeSocket.latest().drop();
    vi.advanceTimersByTime(999);
    expect(FakeSocket.instances).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(FakeSocket.instances).toHaveLength(3);
  });

  it('resets the backoff after a successful connection', () => {
    const { client, statuses } = setup();
    client.start();
    FakeSocket.latest().drop();
    vi.advanceTimersByTime(500);
    FakeSocket.latest().drop();
    vi.advanceTimersByTime(1000);
    FakeSocket.latest().open();
    expect(statuses.at(-1)).toBe('connected');

    FakeSocket.latest().drop();
    vi.advanceTimersByTime(500);

    expect(FakeSocket.instances).toHaveLength(4);
  });

  it('does not reconnect after stop()', () => {
    const { client, statuses } = setup();
    client.start();
    const socket = FakeSocket.latest();
    socket.open();

    client.stop();
    vi.advanceTimersByTime(10_000);

    expect(socket.closed).toBe(true);
    expect(FakeSocket.instances).toHaveLength(1);
    expect(statuses.at(-1)).toBe('closed');
  });
});
