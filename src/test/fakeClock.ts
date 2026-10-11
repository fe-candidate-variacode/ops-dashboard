import type { Clock } from '../features/telemetry/flushScheduler';

/**
 * Clock backed by Vitest fake timers: `now` follows the faked Date and a
 * "frame" fires 16ms after it is requested. Call `vi.useFakeTimers()` first.
 */
export const fakeClock: Clock = {
  now: () => Date.now(),
  setTimeout: (callback, ms) => setTimeout(callback, ms),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  requestAnimationFrame: (callback) => setTimeout(callback, 16),
  cancelAnimationFrame: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};
