import { describe, expect, it } from 'vitest';
import { allKeys } from './utils';

describe('allKeys', () => {
  it('returns the sorted union of keys across all objects', () => {
    const values = [{ b: 1, a: 2 }, { c: 3 }];

    expect(allKeys(values)).toStrictEqual(['a', 'b', 'c']);
  });

  it('deduplicates keys shared across objects', () => {
    const values = [{ a: 1 }, { a: 2 }];

    expect(allKeys(values)).toStrictEqual(['a']);
  });

  it('returns an empty array for an empty list', () => {
    expect(allKeys([])).toStrictEqual([]);
  });
});
