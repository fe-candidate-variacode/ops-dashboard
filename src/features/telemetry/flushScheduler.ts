/** Timing primitives, injectable so the scheduler can be tested without real time. */
export interface Clock {
  now(): number;
  setTimeout(callback: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
  requestAnimationFrame(callback: () => void): unknown;
  cancelAnimationFrame(handle: unknown): void;
}

export const browserClock: Clock = {
  now: () => performance.now(),
  setTimeout: (callback, ms) => window.setTimeout(callback, ms),
  clearTimeout: (handle) => window.clearTimeout(handle as number),
  requestAnimationFrame: (callback) => window.requestAnimationFrame(() => callback()),
  cancelAnimationFrame: (handle) => window.cancelAnimationFrame(handle as number),
};

export interface FlushSchedulerOptions {
  /** Minimum time between flushes. 250ms caps the store at ~4 updates per second. */
  minIntervalMs?: number;
  clock?: Clock;
}

/**
 * Rate-limits `flush`: any number of `schedule()` calls between two flushes
 * result in a single flush, at most once per `minIntervalMs`, aligned to a
 * paint frame. In a hidden tab the frame callback is paused by the browser, so
 * work is skipped entirely while the buffer keeps coalescing.
 */
export class FlushScheduler {
  private readonly flush: () => void;
  private readonly minIntervalMs: number;
  private readonly clock: Clock;
  private lastFlushAt = Number.NEGATIVE_INFINITY;
  private pending = false;
  private timer: unknown = null;
  private frame: unknown = null;

  constructor(
    flush: () => void,
    { minIntervalMs = 250, clock = browserClock }: FlushSchedulerOptions = {},
  ) {
    this.flush = flush;
    this.minIntervalMs = minIntervalMs;
    this.clock = clock;
  }

  schedule(): void {
    if (this.pending) return;
    this.pending = true;

    const wait = this.lastFlushAt + this.minIntervalMs - this.clock.now();
    if (wait <= 0) {
      this.requestFrame();
    } else {
      this.timer = this.clock.setTimeout(() => {
        this.timer = null;
        this.requestFrame();
      }, wait);
    }
  }

  dispose(): void {
    if (this.timer !== null) this.clock.clearTimeout(this.timer);
    if (this.frame !== null) this.clock.cancelAnimationFrame(this.frame);
    this.timer = null;
    this.frame = null;
    this.pending = false;
  }

  private requestFrame(): void {
    this.frame = this.clock.requestAnimationFrame(() => {
      this.frame = null;
      this.pending = false;
      this.lastFlushAt = this.clock.now();
      this.flush();
    });
  }
}
