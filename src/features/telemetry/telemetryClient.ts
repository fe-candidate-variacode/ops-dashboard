import { DEFAULT_BACKOFF, backoffDelay } from '../../lib/backoff';
import type { BackoffOptions } from '../../lib/backoff';
import { parseServerMessage } from './protocol';
import type { ConnectionStatus, ServerMessage } from './types';

/** The subset of WebSocket the client relies on, so tests can provide a fake. */
export interface SocketLike {
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  close(): void;
}

export interface TelemetryClientOptions {
  url: string;
  onMessage: (message: ServerMessage) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  backoff?: BackoffOptions;
  random?: () => number;
  createSocket?: (url: string) => SocketLike;
}

/**
 * Owns the WebSocket lifecycle outside React: connect, parse, and reconnect with
 * exponential backoff. It knows nothing about stores or rendering.
 */
export class TelemetryClient {
  private readonly options: TelemetryClientOptions;
  private socket: SocketLike | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private attempt = 0;
  private stopped = true;

  constructor(options: TelemetryClientOptions) {
    this.options = options;
  }

  start(): void {
    if (!this.stopped) return;
    this.stopped = false;
    this.attempt = 0;
    this.options.onStatusChange('connecting');
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    if (this.retryTimer !== null) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    const socket = this.socket;
    this.socket = null;
    if (socket) {
      socket.onopen = socket.onmessage = socket.onclose = socket.onerror = null;
      socket.close();
    }
    this.options.onStatusChange('closed');
  }

  private connect(): void {
    const create = this.options.createSocket ?? ((url: string) => new WebSocket(url));
    const socket = create(this.options.url);
    this.socket = socket;

    socket.onopen = () => {
      this.attempt = 0;
      this.options.onStatusChange('connected');
    };

    socket.onmessage = (event) => {
      if (typeof event.data !== 'string') return;
      const message = parseServerMessage(event.data);
      if (message) this.options.onMessage(message);
    };

    socket.onclose = () => {
      if (this.stopped || this.socket !== socket) return;
      this.socket = null;
      this.options.onStatusChange('reconnecting');
      const delay = backoffDelay(
        this.attempt,
        this.options.backoff ?? DEFAULT_BACKOFF,
        this.options.random,
      );
      this.attempt += 1;
      this.retryTimer = setTimeout(() => {
        this.retryTimer = null;
        this.connect();
      }, delay);
    };
  }
}
