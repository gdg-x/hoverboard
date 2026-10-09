import { Initialized, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import reducer, { selectFilters, setFilters } from '.';
import { FilterGroupKey } from '../../models/filter-group';
import { dispatch } from '../dispatch';
import type { RootState } from '..';

vi.mock('../dispatch');

describe('filters', () => {
  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });

  it('stores the provided filters as a Success', () => {
    const filters = [{ group: FilterGroupKey.tags, tag: 'a11y' }];

    expect(reducer(new Initialized(), { type: 'filters/set', payload: filters })).toStrictEqual(
      new Success(filters),
    );
  });
});

describe('setFilters', () => {
  it('dispatches a set action with the provided filters', () => {
    const filters = [{ group: FilterGroupKey.tags, tag: 'a11y' }];
    setFilters(filters);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'filters/set', payload: filters }),
    );
  });
});

describe('selectFilters', () => {
  it('returns the filters once loaded', () => {
    const filters = [{ group: FilterGroupKey.tags, tag: 'a11y' }];
    const state = { filters: new Success(filters) } as unknown as RootState;

    expect(selectFilters(state)).toStrictEqual(filters);
  });

  it('returns no filters until the app sets them', () => {
    const state = { filters: new Initialized() } as unknown as RootState;

    expect(selectFilters(state)).toStrictEqual([]);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('returns the same empty array each time, so selectors that read it stay memoized', () => {
    const state = { filters: new Initialized() } as unknown as RootState;

    expect(selectFilters(state)).toBe(selectFilters({ ...state }));
  });
});
