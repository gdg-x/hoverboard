import { describe, expect, it } from 'vitest';
import { combineTags, pickMainTag } from '../../src/utils/tags';

describe('pickMainTag', () => {
  it('returns the first tag when tags are provided', () => {
    expect(pickMainTag(['a11y', 'web'])).toBe('a11y');
  });

  it('returns "General" when tags is undefined', () => {
    expect(pickMainTag(undefined)).toBe('General');
  });

  it('returns "General" when tags is an empty array', () => {
    expect(pickMainTag([])).toBe('General');
  });
});

describe('combineTags', () => {
  it('combines speaker and session tags, removing duplicates', () => {
    expect(combineTags(['a11y', 'web'], ['web', 'css'])).toStrictEqual(['a11y', 'web', 'css']);
  });

  it('handles missing speaker tags', () => {
    expect(combineTags(undefined, ['web'])).toStrictEqual(['web']);
  });

  it('handles missing session tags', () => {
    expect(combineTags(['a11y'], undefined)).toStrictEqual(['a11y']);
  });

  it('returns an empty array when both are missing', () => {
    expect(combineTags(undefined, undefined)).toStrictEqual([]);
  });
});
