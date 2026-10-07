import { describe, expect, it } from 'vitest';
import { deepMerge } from './merge';

describe('deepMerge', () => {
  it('merges nested objects', () => {
    expect(
      deepMerge({ hero: { title: 'Speakers', color: 'white' } }, { hero: { color: 'black' } }),
    ).toEqual({ hero: { title: 'Speakers', color: 'black' } });
  });

  it('replaces arrays instead of appending', () => {
    expect(deepMerge({ links: ['a', 'b'] }, { links: ['c'] })).toEqual({ links: ['c'] });
  });

  it('replaces objects with other values and the other way around', () => {
    expect(deepMerge({ a: { b: 1 }, c: 1 }, { a: 'text', c: { d: 2 } })).toEqual({
      a: 'text',
      c: { d: 2 },
    });
  });

  it('does not change its arguments', () => {
    const base = { hero: { title: 'Speakers' } };
    const override = { hero: { color: 'black' } };

    deepMerge(base, override);

    expect(base).toEqual({ hero: { title: 'Speakers' } });
    expect(override).toEqual({ hero: { color: 'black' } });
  });
});
