import { act, render } from '@testing-library/react';
import { fakeClock } from '../../test/fakeClock';
import { FakeSocket } from '../../test/fakeSocket';
import { makeNode } from '../../test/factories';
import { startTelemetry } from './startTelemetry';
import { createTelemetryStore } from './telemetryStore';
import type { TelemetryStore } from './telemetryStore';
import { useStore } from 'zustand';

function start(store: TelemetryStore) {
  return startTelemetry({
    url: 'ws://test/ws',
    store,
    flushIntervalMs: 250,
    clock: fakeClock,
    createSocket: (url) => new FakeSocket(url),
  });
}

describe('startTelemetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeSocket.reset();
  });
  afterEach(() => vi.useRealTimers());

  it('renders subscribers once per flush, not once per message', () => {
    const store = createTelemetryStore();
    let renders = 0;
    function Probe() {
      renders += 1;
      const count = useStore(store, (state) => Object.keys(state.nodesById).length);
      return <p>{count} nodes</p>;
    }
    const stop = start(store);
    const socket = FakeSocket.latest();
    const view = render(<Probe />);
    act(() => socket.open());
    const rendersBeforeStream = renders;

    act(() => {
      socket.receive({
        type: 'snapshot',
        nodes: [makeNode({ nodeId: 'a' }), makeNode({ nodeId: 'b' })],
      });
      for (let i = 0; i < 50; i += 1) {
        socket.receive({ type: 'update', nodes: [makeNode({ nodeId: 'a', cpu: i })] });
      }
    });
    expect(renders).toBe(rendersBeforeStream);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(view.getByText('2 nodes')).toBeInTheDocument();
    expect(renders).toBe(rendersBeforeStream + 1);
    stop();
  });

  it('stores the latest value received for a node in the flushed batch', () => {
    const store = createTelemetryStore();
    const stop = start(store);
    const socket = FakeSocket.latest();
    socket.open();

    socket.receive({ type: 'snapshot', nodes: [makeNode({ nodeId: 'a', cpu: 1 })] });
    socket.receive({ type: 'update', nodes: [makeNode({ nodeId: 'a', cpu: 77 })] });
    vi.advanceTimersByTime(300);

    expect(store.getState().nodesById['a']?.cpu).toBe(77);
    stop();
  });

  it('publishes updates per second and connection status', () => {
    const store = createTelemetryStore();
    const stop = start(store);
    const socket = FakeSocket.latest();
    socket.open();
    expect(store.getState().connectionStatus).toBe('connected');

    socket.receive({
      type: 'update',
      nodes: Array.from({ length: 30 }, (_, i) => makeNode({ nodeId: `n-${i}` })),
    });
    vi.advanceTimersByTime(1000);

    expect(store.getState().updatesPerSecond).toBe(30);
    stop();
  });

  it('stops everything on dispose', () => {
    const store = createTelemetryStore();
    const stop = start(store);
    const socket = FakeSocket.latest();
    socket.open();

    stop();

    expect(socket.closed).toBe(true);
    expect(store.getState().connectionStatus).toBe('closed');
  });
});
