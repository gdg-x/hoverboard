import { Initialized, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import reducer, { selectMembers } from '.';
import { Member } from '../../models/member';
import { subscribeToCollectionGroup } from '../../utils/firestore';
import { RootState } from '..';

vi.mock('../../utils/firestore');
vi.mock('../dispatch');

describe('members', () => {
  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });
});

describe('selectMembers', () => {
  it('subscribes on first read', () => {
    vi.mocked(subscribeToCollectionGroup).mockReturnValue(new Success(vi.fn()));
    const state = { members: new Initialized() } as unknown as RootState;

    expect(selectMembers(state)).toStrictEqual(new Pending());
    expect(subscribeToCollectionGroup).toHaveBeenCalledWith(
      'members',
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('returns the existing state without re-fetching once loaded', () => {
    const items = [{ id: '1' }] as unknown as Member[];
    const state = { members: new Success(items) } as unknown as RootState;

    expect(selectMembers(state)).toStrictEqual(new Success(items));
  });
});
