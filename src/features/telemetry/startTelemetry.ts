import { FlushScheduler } from './flushScheduler';
import type { Clock } from './flushScheduler';
import { TelemetryClient } from './telemetryClient';
import type { SocketLike } from './telemetryClient';
import type { TelemetryStore } from './telemetryStore';
import { UpdateBuffer } from './updateBuffer';

export interface StartTelemetryOptions {
  url: string;
  store: TelemetryStore;
  flushIntervalMs?: number;
  clock?: Clock;
  createSocket?: (url: string) => SocketLike;
}

/**
 * Wires the data flow outside React:
 * socket -> parse -> coalescing buffer -> rate-limited flush -> store.
 * Returns a disposer.
 */
export function startTelemetry({
  url,
  store,
  flushIntervalMs = 250,
  clock,
  createSocket,
}: StartTelemetryOptions): () => void {
  const buffer = new UpdateBuffer();
  let receivedSinceLastTick = 0;

  const scheduler = new FlushScheduler(
    () => {
      const batch = buffer.drain();
      if (batch) store.getState().applyBatch(batch);
    },
    { minIntervalMs: flushIntervalMs, clock },
  );

  const client = new TelemetryClient({
    url,
    createSocket,
    onMessage: (message) => {
      receivedSinceLastTick += message.nodes.length;
      buffer.push(message);
      scheduler.schedule();
    },
    onStatusChange: (status) => store.getState().setConnectionStatus(status),
  });

  // Node updates received per second, published once per second.
  const rateTimer = setInterval(() => {
    store.getState().setUpdatesPerSecond(receivedSinceLastTick);
    receivedSinceLastTick = 0;
  }, 1000);

  client.start();

  return () => {
    clearInterval(rateTimer);
    client.stop();
    scheduler.dispose();
  };
}
