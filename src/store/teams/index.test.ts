import { Initialized, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import reducer, { selectTeams } from '.';
import { TeamWithoutMembers } from '../../models/team';
import { subscribeToTeams } from '../../db/teams';
import { RootState } from '..';

vi.mock('../../db/teams');
vi.mock('../dispatch');

describe('teams', () => {
  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });
});

describe('selectTeams', () => {
  it('subscribes on first read', () => {
    vi.mocked(subscribeToTeams).mockReturnValue(new Success(vi.fn()));
    const state = { teams: new Initialized() } as unknown as RootState;

    expect(selectTeams(state)).toStrictEqual(new Pending());
    expect(subscribeToTeams).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('returns the existing state without re-fetching once loaded', () => {
    const items = [{ id: '1' }] as unknown as TeamWithoutMembers[];
    const state = { teams: new Success(items) } as unknown as RootState;

    expect(selectTeams(state)).toStrictEqual(new Success(items));
  });
});
