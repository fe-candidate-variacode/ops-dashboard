import { fakeClock } from '../../test/fakeClock';
import { FlushScheduler } from './flushScheduler';

describe('FlushScheduler', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('collapses many schedule calls into a single flush', () => {
    const flush = vi.fn();
    const scheduler = new FlushScheduler(flush, { minIntervalMs: 250, clock: fakeClock });

    for (let i = 0; i < 100; i += 1) scheduler.schedule();
    vi.advanceTimersByTime(20);

    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('does not flush more often than the minimum interval', () => {
    const flush = vi.fn();
    const scheduler = new FlushScheduler(flush, { minIntervalMs: 250, clock: fakeClock });

    scheduler.schedule();
    vi.advanceTimersByTime(20);
    expect(flush).toHaveBeenCalledTimes(1);

    scheduler.schedule();
    vi.advanceTimersByTime(100);
    expect(flush).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(200);
    expect(flush).toHaveBeenCalledTimes(2);
  });

  it('flushes again for work scheduled after a flush', () => {
    const flush = vi.fn();
    const scheduler = new FlushScheduler(flush, { minIntervalMs: 0, clock: fakeClock });

    scheduler.schedule();
    vi.advanceTimersByTime(20);
    scheduler.schedule();
    vi.advanceTimersByTime(20);

    expect(flush).toHaveBeenCalledTimes(2);
  });

  it('cancels a pending flush on dispose', () => {
    const flush = vi.fn();
    const scheduler = new FlushScheduler(flush, { minIntervalMs: 250, clock: fakeClock });

    scheduler.schedule();
    scheduler.dispose();
    vi.advanceTimersByTime(1000);

    expect(flush).not.toHaveBeenCalled();
  });
});
