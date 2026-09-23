import { describe, expect, it } from 'vitest';
import { isEmpty, snapshotToObject } from '../../src/utils/firestore';

describe('snapshotToObject', () => {
  it('reduces query snapshot docs into an id-keyed object', () => {
    const snapshot = {
      docs: [
        { id: 'a', data: () => ({ name: 'Ada' }) },
        { id: 'b', data: () => ({ name: 'Grace' }) },
      ],
    } as never;

    expect(snapshotToObject(snapshot)).toStrictEqual({
      a: { name: 'Ada' },
      b: { name: 'Grace' },
    });
  });

  it('returns an empty object for an empty snapshot', () => {
    const snapshot = { docs: [] } as never;

    expect(snapshotToObject(snapshot)).toStrictEqual({});
  });
});

describe('isEmpty', () => {
  it('returns true for undefined', () => {
    expect(isEmpty(undefined as unknown as object)).toBe(true);
  });

  it('returns true for null', () => {
    expect(isEmpty(null as unknown as object)).toBe(true);
  });

  it('returns true for an empty object', () => {
    expect(isEmpty({})).toBe(true);
  });

  it('returns false for a non-empty object', () => {
    expect(isEmpty({ a: 1 })).toBe(false);
  });
});
