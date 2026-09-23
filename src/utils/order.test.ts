import { describe, expect, it } from 'vitest';
import { order } from './order';

describe('order', () => {
  it('sorts ascending by the order property', () => {
    const items = [{ order: 3 }, { order: 1 }, { order: 2 }];

    expect(items.sort(order)).toStrictEqual([{ order: 1 }, { order: 2 }, { order: 3 }]);
  });

  it('returns 0 for equal order values', () => {
    expect(order({ order: 1 }, { order: 1 })).toBe(0);
  });

  it('returns a negative number when a is before b', () => {
    expect(order({ order: 1 }, { order: 2 })).toBeLessThan(0);
  });

  it('returns a positive number when a is after b', () => {
    expect(order({ order: 2 }, { order: 1 })).toBeGreaterThan(0);
  });
});
