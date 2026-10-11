import { RingBuffer } from './ringBuffer';

describe('RingBuffer', () => {
  it('keeps items in insertion order while below capacity', () => {
    const ring = new RingBuffer<number>(3).push(1).push(2);

    expect(ring.toArray()).toEqual([1, 2]);
    expect(ring.size).toBe(2);
    expect(ring.last).toBe(2);
  });

  it('evicts the oldest item once capacity is exceeded', () => {
    const ring = [1, 2, 3, 4, 5].reduce((acc, n) => acc.push(n), new RingBuffer<number>(3));

    expect(ring.toArray()).toEqual([3, 4, 5]);
    expect(ring.size).toBe(3);
  });

  it('does not mutate the previous buffer', () => {
    const before = new RingBuffer<number>(2).push(1);
    const after = before.push(2);

    expect(before.toArray()).toEqual([1]);
    expect(after.toArray()).toEqual([1, 2]);
    expect(after).not.toBe(before);
  });

  it('reports no last item when empty', () => {
    expect(new RingBuffer<number>(2).last).toBeUndefined();
  });

  it('rejects a non-positive capacity', () => {
    expect(() => new RingBuffer(0)).toThrow(RangeError);
  });
});
