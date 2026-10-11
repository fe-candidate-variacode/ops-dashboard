import type { SocketLike } from '../features/telemetry/telemetryClient';

export class FakeSocket implements SocketLike {
  static instances: FakeSocket[] = [];

  static reset(): void {
    FakeSocket.instances = [];
  }

  static latest(): FakeSocket {
    const socket = FakeSocket.instances[FakeSocket.instances.length - 1];
    if (!socket) throw new Error('No socket has been created yet');
    return socket;
  }

  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  closed = false;

  constructor(readonly url: string) {
    FakeSocket.instances.push(this);
  }

  close(): void {
    this.closed = true;
  }

  // Helpers that simulate server-side events.
  open(): void {
    this.onopen?.(new Event('open'));
  }

  receive(payload: unknown): void {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    this.onmessage?.(new MessageEvent('message', { data }));
  }

  drop(): void {
    this.onclose?.(new CloseEvent('close'));
  }
}
