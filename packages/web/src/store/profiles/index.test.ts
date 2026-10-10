import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import reducer, {
  deleteOwnProfile,
  resetProfiles,
  selectOwnProfileState,
  selectProfile,
  setOwnProfile,
  unwatchProfiles,
  watchProfiles,
} from '.';
import type { RootState } from '..';
import {
  deleteProfile,
  saveProfile,
  subscribeToOwnProfile,
  subscribeToProfiles,
} from '../../db/profiles';
import type { Profile } from '../../models/profile';
import { dispatch, getState } from '../dispatch';
import { selectOwnReactionsState } from '../reactions';
import { queueSnackbar } from '../snackbars';
import { setPendingIds } from '../sync';
import { selectUserId } from '../user';

vi.mock('../../db/profiles', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../db/profiles')>()),
  deleteProfile: vi.fn(),
  saveProfile: vi.fn(),
  subscribeToOwnProfile: vi.fn(),
  subscribeToProfiles: vi.fn(),
}));
vi.mock('../dispatch');
vi.mock('../reactions', () => ({ selectOwnReactionsState: vi.fn() }));
vi.mock('../sync', () => ({ setPendingIds: vi.fn() }));
vi.mock('../snackbars', () => ({
  queueSnackbar: vi.fn((label: string) => ({ type: 'snackbars/queueSnackbar', payload: label })),
}));
vi.mock('../user', () => ({ selectUserId: vi.fn() }));

const ada: Profile = { id: 'ada', name: 'Ada Lovelace', photoUrl: '' };
const grace: Profile = { id: 'grace', name: 'Grace Hopper', photoUrl: '' };
const state = (profiles = reducer(undefined, { type: '@@INIT' })) =>
  ({ profiles }) as unknown as RootState;
const actions = () => vi.mocked(dispatch).mock.calls.map(([action]) => action);

afterEach(() => {
  unwatchProfiles();
  resetProfiles();
  vi.clearAllMocks();
});

describe('profiles reducer', () => {
  it('starts with no profiles', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual({
      own: new Initialized(),
      byId: {},
    });
  });

  it('keeps the watched profiles, and drops watched users without one', () => {
    let next = reducer(undefined, {
      type: 'profiles/loaded',
      payload: { userIds: ['ada', 'grace'], profiles: [ada, grace] },
    });
    next = reducer(next, {
      type: 'profiles/loaded',
      payload: { userIds: ['grace'], profiles: [] },
    });

    expect(next.byId).toStrictEqual({ ada });
    expect(selectProfile(state(next), 'ada')).toBe(ada);
    expect(selectProfile(state(next), 'grace')).toBeUndefined();
  });

  it("tracks the visitor's own profile", () => {
    const error = new Error('denied');
    let next = reducer(undefined, { type: 'profiles/ownPending' });
    expect(next.own).toStrictEqual(new Pending());
    next = reducer(next, { type: 'profiles/ownSuccess', payload: false });
    expect(next.own).toStrictEqual(new Success(false));
    next = reducer(next, { type: 'profiles/ownFailure', payload: error });
    expect(next.own).toStrictEqual(new Failure(error));
    next = reducer(next, { type: 'profiles/ownReset' });
    expect(next.own).toStrictEqual(new Initialized());
  });
});

describe('watchProfiles', () => {
  it('listens to the profiles of the users a page shows, once for the same users', () => {
    vi.mocked(subscribeToProfiles).mockImplementation((_ids, onNext) => {
      onNext([ada]);
      return vi.fn();
    });

    watchProfiles(['ada', 'grace', 'ada']);
    watchProfiles(['grace', 'ada']);

    expect(subscribeToProfiles).toHaveBeenCalledOnce();
    expect(subscribeToProfiles).toHaveBeenCalledWith(
      ['ada', 'grace'],
      expect.any(Function),
      expect.any(Function),
    );
    expect(actions()).toEqual([
      { type: 'profiles/loaded', payload: { userIds: ['ada', 'grace'], profiles: [ada] } },
    ]);
  });

  it('replaces the listener when the users change, and stops with no users', () => {
    const first = vi.fn();
    const second = vi.fn();
    vi.mocked(subscribeToProfiles).mockReturnValueOnce(first).mockReturnValueOnce(second);

    watchProfiles(['ada']);
    watchProfiles(['grace']);

    expect(first).toHaveBeenCalled();
    expect(subscribeToProfiles).toHaveBeenCalledTimes(2);

    unwatchProfiles();

    expect(second).toHaveBeenCalled();
    expect(subscribeToProfiles).toHaveBeenCalledTimes(2);
  });

  it('ignores listener errors, since names are extras', () => {
    vi.mocked(subscribeToProfiles).mockImplementation((_ids, _onNext, onError) => {
      onError(new Error('unavailable'));
      return vi.fn();
    });

    watchProfiles(['ada']);

    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe("the visitor's own profile", () => {
  beforeEach(() => {
    vi.mocked(getState).mockReturnValue(state());
  });

  it('starts listening the first time it is read while signed in, and reports what is unsynced', () => {
    vi.mocked(selectUserId).mockReturnValue('ada');
    vi.mocked(subscribeToOwnProfile).mockImplementation((_userId, onStart, onNext, onError) => {
      onStart();
      onNext(undefined, { pending: false });
      onNext(ada, { pending: true });
      onError(new Error('denied'));
      return new Success(vi.fn());
    });

    selectOwnProfileState(state());
    selectOwnProfileState(state());

    expect(subscribeToOwnProfile).toHaveBeenCalledOnce();
    expect(vi.mocked(setPendingIds).mock.calls).toEqual([
      ['profiles', []],
      ['profiles', ['ada']],
    ]);
    expect(actions()).toEqual([
      { type: 'profiles/ownPending', payload: undefined },
      { type: 'profiles/ownSuccess', payload: false },
      { type: 'profiles/ownSuccess', payload: ada },
      { type: 'profiles/ownFailure', payload: new Error('denied') },
    ]);
  });

  it("isn't listened to while signed out", () => {
    vi.mocked(selectUserId).mockReturnValue(undefined);

    expect(selectOwnProfileState(state())).toStrictEqual(new Initialized());
    expect(subscribeToOwnProfile).not.toHaveBeenCalled();
  });

  it('stops when the visitor signs out', () => {
    const unsubscribe = vi.fn();
    vi.mocked(selectUserId).mockReturnValue('ada');
    vi.mocked(subscribeToOwnProfile).mockReturnValue(new Success(unsubscribe));
    selectOwnProfileState(state());

    resetProfiles();

    expect(unsubscribe).toHaveBeenCalled();
    expect(actions().at(-1)).toEqual({ type: 'profiles/ownReset', payload: undefined });
  });
});

describe('setOwnProfile', () => {
  it('saves the name without spaces around it', () => {
    setOwnProfile('ada', { name: '  Ada Lovelace ', photoUrl: '' });

    expect(saveProfile).toHaveBeenCalledWith(
      'ada',
      { name: 'Ada Lovelace', photoUrl: '' },
      expect.any(Function),
    );
  });

  it('says so when the server refuses it', () => {
    vi.mocked(saveProfile).mockImplementation((_userId, _profile, onRejected) =>
      onRejected(new Error('permission-denied')),
    );

    setOwnProfile('ada', { name: 'Ada', photoUrl: '' });

    expect(queueSnackbar).toHaveBeenCalledWith("Couldn't save your profile. Try again.");
  });
});

describe('deleteOwnProfile', () => {
  it("deletes the visitor's reactions in every session, and their profile", () => {
    vi.mocked(getState).mockReturnValue(state());
    vi.mocked(selectOwnReactionsState).mockReturnValue(
      new Success({ '101': ['love'], '102': ['funny'] }),
    );

    expect(deleteOwnProfile('ada')).toBe(true);
    expect(deleteProfile).toHaveBeenCalledWith('ada', ['101', '102'], expect.any(Function));
  });

  it("waits until the visitor's reactions have loaded", () => {
    vi.mocked(getState).mockReturnValue(state());
    vi.mocked(selectOwnReactionsState).mockReturnValue(new Pending());

    expect(deleteOwnProfile('ada')).toBe(false);
    expect(deleteProfile).not.toHaveBeenCalled();
  });
});
