import { describe, expect, it } from 'vitest';
import { isEmpty, randomOrder } from './arrays';

describe('isEmpty', () => {
  it('returns true for an empty array', () => {
    expect(isEmpty([])).toBe(true);
  });

  it('returns false for a non-empty array', () => {
    expect(isEmpty([1])).toBe(false);
  });
});

describe('randomOrder', () => {
  it('returns an array with the same elements', () => {
    const array = [1, 2, 3, 4, 5];

    expect(randomOrder(array).sort()).toStrictEqual(array.sort());
  });

  it('does not mutate the original array', () => {
    const array = [1, 2, 3];

    randomOrder(array);

    expect(array).toStrictEqual([1, 2, 3]);
  });
});
