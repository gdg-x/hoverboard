import { Initialized, Success } from '@abraham/remotedata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import reducer, { removeUser, selectUser, selectUserId, setUser, setUserSuccess } from '.';
import { dispatch } from '../dispatch';
import type { FirebaseUser, User } from '../../models/user';
import type { RootState } from '..';

vi.mock('../dispatch');

describe('user', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });

  it('stores and clears the current user through the reducer', () => {
    const user = { uid: 'user-1' } as User;

    expect(reducer(new Initialized(), setUserSuccess(user))).toStrictEqual(new Success(user));
    expect(reducer(new Success(user), { type: 'user/reset' })).toStrictEqual(new Initialized());
  });

  it('dispatches the serialized firebase user', () => {
    const toJSON = vi.fn(() => ({
      uid: 'user-1',
      displayName: 'Ada Lovelace',
    }));
    const firebaseUser = {
      toJSON,
    } as unknown as FirebaseUser;

    setUser(firebaseUser);

    expect(toJSON).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(
      setUserSuccess({
        uid: 'user-1',
        displayName: 'Ada Lovelace',
      } as User),
    );
  });

  it('dispatches reset when removing the user', () => {
    removeUser();

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'user/reset' }));
  });

  it('selectUser returns the user slice state', () => {
    const state = { user: new Success({ uid: 'user-1' } as User) } as RootState;

    expect(selectUser(state)).toStrictEqual(state.user);
  });

  it('selectUserId returns the current user id when signed in', () => {
    const state = { user: new Success({ uid: 'user-1' } as User) } as RootState;

    expect(selectUserId(state)).toBe('user-1');
  });

  it('selectUserId returns undefined when no user is present', () => {
    const state = { user: new Initialized() } as RootState;

    expect(selectUserId(state)).toBeUndefined();
  });
});
