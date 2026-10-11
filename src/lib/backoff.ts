export interface BackoffOptions {
  baseMs: number;
  maxMs: number;
  factor: number;
  /** Fraction (0..1) of the delay that may be randomly shaved off to avoid thundering herds. */
  jitter: number;
}

export const DEFAULT_BACKOFF: BackoffOptions = {
  baseMs: 500,
  maxMs: 10_000,
  factor: 2,
  jitter: 0.5,
};

/** Delay before reconnect attempt number `attempt` (0-based). */
export function backoffDelay(
  attempt: number,
  options: BackoffOptions = DEFAULT_BACKOFF,
  random: () => number = Math.random,
): number {
  const exponential = Math.min(options.maxMs, options.baseMs * options.factor ** attempt);
  return Math.round(exponential * (1 - options.jitter * random()));
}
