import { Initialized, Pending, Success } from '@abraham/remotedata';
import { orderBy } from 'firebase/firestore';
import { describe, expect, it, vi } from 'vitest';
import reducer, { selectTeams } from '.';
import { TeamWithoutMembers } from '../../models/team';
import { subscribeToCollection } from '../../utils/firestore';
import { RootState } from '..';

vi.mock('../../utils/firestore');
vi.mock('../dispatch');

describe('teams', () => {
  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });
});

describe('selectTeams', () => {
  it('subscribes on first read', () => {
    vi.mocked(subscribeToCollection).mockReturnValue(new Success(vi.fn()));
    const state = { teams: new Initialized() } as unknown as RootState;

    expect(selectTeams(state)).toStrictEqual(new Pending());
    expect(subscribeToCollection).toHaveBeenCalledWith(
      'team',
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      orderBy('title'),
    );
  });

  it('returns the existing state without re-fetching once loaded', () => {
    const items = [{ id: '1' }] as unknown as TeamWithoutMembers[];
    const state = { teams: new Success(items) } as unknown as RootState;

    expect(selectTeams(state)).toStrictEqual(new Success(items));
  });
});
