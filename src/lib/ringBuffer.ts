/**
 * Fixed-capacity, immutable ring buffer. `push` returns a new buffer so the
 * reference changes whenever the content does, which is what reference-equality
 * selectors need. Cost is O(capacity) per push, bounded by the small history size.
 */
export class RingBuffer<T> {
  readonly capacity: number;
  private readonly items: readonly T[];

  constructor(capacity: number, items: readonly T[] = []) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new RangeError('RingBuffer capacity must be a positive integer');
    }
    this.capacity = capacity;
    this.items = items.length > capacity ? items.slice(items.length - capacity) : items;
  }

  get size(): number {
    return this.items.length;
  }

  get last(): T | undefined {
    return this.items[this.items.length - 1];
  }

  push(item: T): RingBuffer<T> {
    const next =
      this.items.length >= this.capacity
        ? [...this.items.slice(this.items.length - this.capacity + 1), item]
        : [...this.items, item];
    return new RingBuffer(this.capacity, next);
  }

  /** Items ordered oldest to newest. */
  toArray(): readonly T[] {
    return this.items;
  }
}
