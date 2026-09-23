import { Success } from '@abraham/remotedata';
import { describe, expect, it } from 'vitest';
import { selectFilterGroups, selectSession } from './selectors';
import { FilterGroupKey } from '../../models/filter-group';
import { Session } from '../../models/session';
import { RootState } from '..';

const sessions: Session[] = [
  { id: '1', title: 'Talk one', description: '', tags: ['a11y', 'web'], complexity: 'Beginner' },
  { id: '2', title: 'Talk two', description: '', tags: ['web'], complexity: 'Advanced' },
];

describe('selectSession', () => {
  it('finds the session with the given id', () => {
    const state = { sessions: new Success(sessions) } as unknown as RootState;

    expect(selectSession(state, '2')).toStrictEqual(sessions[1]);
  });

  it('returns undefined when no session matches', () => {
    const state = { sessions: new Success(sessions) } as unknown as RootState;

    expect(selectSession(state, 'missing')).toBeUndefined();
  });
});

describe('selectFilterGroups', () => {
  it('builds filter groups from the unique tags and complexity values, for the requested groups', () => {
    const state = { sessions: new Success(sessions) } as unknown as RootState;

    const groups = selectFilterGroups(state, undefined);

    expect(groups.map((group) => group.key)).toStrictEqual(['tags', 'complexity']);
    expect(groups[0]!.filters).toStrictEqual(
      expect.arrayContaining([
        { group: 'tags', tag: 'a11y' },
        { group: 'tags', tag: 'web' },
      ]),
    );
    expect(groups[1]!.filters).toStrictEqual(
      expect.arrayContaining([
        { group: 'complexity', tag: 'Beginner' },
        { group: 'complexity', tag: 'Advanced' },
      ]),
    );
  });

  it('memoizes across repeated calls with no explicit groups argument', () => {
    const state = { sessions: new Success(sessions) } as unknown as RootState;

    // Regression test: the default `groups` parameter used to be a fresh
    // array literal on every call, which is a *new reference* each time and
    // defeats `createSelector`'s reference-equality memoization. It's now a
    // stable module-level constant, so repeated calls with the same state
    // return the same (memoized) result reference instead of recomputing.
    const first = selectFilterGroups(state);
    const second = selectFilterGroups(state);

    expect(second).toBe(first);
  });

  it('memoizes across repeated calls with the same groups array reference', () => {
    const state = { sessions: new Success(sessions) } as unknown as RootState;
    const groups = [FilterGroupKey.tags];

    const first = selectFilterGroups(state, groups);
    const second = selectFilterGroups(state, groups);

    expect(second).toBe(first);
  });
});
