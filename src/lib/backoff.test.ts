import { backoffDelay } from './backoff';
import type { BackoffOptions } from './backoff';

const options: BackoffOptions = { baseMs: 500, maxMs: 4000, factor: 2, jitter: 0.5 };

describe('backoffDelay', () => {
  it('grows exponentially with each attempt', () => {
    const noJitter = () => 0;

    expect([0, 1, 2].map((attempt) => backoffDelay(attempt, options, noJitter))).toEqual([
      500, 1000, 2000,
    ]);
  });

  it('never exceeds the maximum delay', () => {
    expect(backoffDelay(20, options, () => 0)).toBe(4000);
  });

  it('shaves off up to the jitter fraction', () => {
    expect(backoffDelay(1, options, () => 1)).toBe(500);
    expect(backoffDelay(1, options, () => 0.5)).toBe(750);
  });
});
