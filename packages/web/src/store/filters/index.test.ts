import { Initialized, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import reducer, { selectFilters, setFilters } from '.';
import { FilterGroupKey } from '../../models/filter-group';
import { dispatch } from '../dispatch';
import { parseFilters } from '../../utils/filters';
import { RootState } from '..';

vi.mock('../dispatch');
vi.mock('../../utils/filters');

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

  it('parses and dispatches the default filters, returning an empty array, when uninitialized', () => {
    vi.mocked(parseFilters).mockReturnValue([
      { group: FilterGroupKey.complexity, tag: 'beginner' },
    ]);
    const state = { filters: new Initialized() } as unknown as RootState;

    expect(selectFilters(state)).toStrictEqual([]);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'filters/set',
        payload: [{ group: FilterGroupKey.complexity, tag: 'beginner' }],
      }),
    );
  });
});
