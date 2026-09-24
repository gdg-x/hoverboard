import { describe, expect, it, vi } from 'vitest';
import { clearFilters, parseFilters, toggleFilter } from './filters';
import { logPageView } from './analytics';
import { FilterGroupKey } from '../models/filter-group';
import { setFilters } from '../store/filters';

vi.mock('./analytics');
vi.mock('../store/filters');

const setUrl = (url: string) => {
  window.history.replaceState({}, '', url);
};

describe('parseFilters', () => {
  it('returns an empty array when there is no query string', () => {
    setUrl('/');

    expect(parseFilters()).toStrictEqual([]);
  });

  it('parses tags and complexity query params into filters', () => {
    setUrl('/?tags=a11y&tags=web&complexity=beginner');

    expect(parseFilters()).toStrictEqual([
      { group: FilterGroupKey.tags, tag: 'a11y' },
      { group: FilterGroupKey.tags, tag: 'web' },
      { group: FilterGroupKey.complexity, tag: 'beginner' },
    ]);
  });
});

describe('toggleFilter', () => {
  it('adds the filter to the query string when not already present', () => {
    setUrl('/?tags=a11y');

    toggleFilter({ group: FilterGroupKey.tags, tag: 'web' });

    expect(window.location.search).toBe('?tags=a11y&tags=web');
    expect(setFilters).toHaveBeenCalledWith([
      { group: FilterGroupKey.tags, tag: 'a11y' },
      { group: FilterGroupKey.tags, tag: 'web' },
    ]);
    expect(logPageView).toHaveBeenCalled();
  });

  it('removes the filter from the query string when already present', () => {
    setUrl('/?tags=a11y&tags=web');

    toggleFilter({ group: FilterGroupKey.tags, tag: 'web' });

    expect(window.location.search).toBe('?tags=a11y');
    expect(setFilters).toHaveBeenCalledWith([{ group: FilterGroupKey.tags, tag: 'a11y' }]);
  });
});

describe('clearFilters', () => {
  it('removes the query string entirely', () => {
    setUrl('/?tags=a11y');

    clearFilters();

    expect(window.location.search).toBe('');
    expect(setFilters).toHaveBeenCalledWith([]);
  });
});
