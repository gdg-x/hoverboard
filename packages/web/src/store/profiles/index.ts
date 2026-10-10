import { Failure, Initialized, Pending, type RemoteData, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Unsubscribe } from 'firebase/firestore';
import type { RootState } from '..';
import {
  deleteProfile,
  MAX_PROFILES,
  saveProfile,
  subscribeToOwnProfile,
  subscribeToProfiles,
} from '../../db/profiles';
import type { Profile, ProfileData } from '../../models/profile';
import type { Subscription } from '../../utils/firestore';
import { dispatch, getState } from '../dispatch';
import { selectOwnReactionsState } from '../reactions';
import { queueSnackbar } from '../snackbars';
import { setPendingIds } from '../sync';
import { selectUserId } from '../user';

export interface ProfilesState {
  /** The signed-in visitor's profile, or `false` before they create one. */
  own: RemoteData<Error, Profile | false>;
  /** Other visitors' profiles that a page watches, by user ID. */
  byId: Record<string, Profile>;
}

const initialState: ProfilesState = { own: new Initialized(), byId: {} };

const slice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {
    loaded: (state, action: PayloadAction<{ userIds: string[]; profiles: Profile[] }>) => {
      // A watched ID without a profile has none, or it was deleted.
      for (const id of action.payload.userIds) delete state.byId[id];
      for (const profile of action.payload.profiles) state.byId[profile.id] = profile;
    },
    ownPending: (state) => {
      state.own = new Pending();
    },
    ownSuccess: (state, action: PayloadAction<Profile | false>) => {
      state.own = new Success(action.payload);
    },
    ownFailure: (state, action: PayloadAction<Error>) => {
      state.own = new Failure(action.payload);
    },
    ownReset: (state) => {
      state.own = new Initialized();
    },
  },
});

const { loaded, ownPending, ownSuccess, ownFailure, ownReset } = slice.actions;

let watched: string[] = [];
let profilesListener: Unsubscribe | undefined;
let ownSubscription: Subscription = new Initialized();

const sameIds = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id) => b.includes(id));

/**
 * Listens to the profiles of these users, replacing the users watched before. Pages name only the
 * users they show, so the first `MAX_PROFILES` are enough.
 */
export const watchProfiles = (userIds: readonly string[]): void => {
  const ids = [...new Set(userIds)].slice(0, MAX_PROFILES);
  if (sameIds(ids, watched)) return;
  profilesListener?.();
  profilesListener = undefined;
  watched = ids;
  if (!ids.length) return;
  profilesListener = subscribeToProfiles(
    ids,
    (profiles) => dispatch(loaded({ userIds: ids, profiles })),
    // Names are extras: without them, labels count reactions instead.
    () => undefined,
  );
};

export const unwatchProfiles = (): void => watchProfiles([]);

const subscribeToOwn = () => {
  const userId = selectUserId(getState());
  if (!userId || !(ownSubscription instanceof Initialized)) return;
  ownSubscription = subscribeToOwnProfile(
    userId,
    () => dispatch(ownPending()),
    (profile, state) => {
      setPendingIds('profiles', state.pending ? [userId] : []);
      dispatch(ownSuccess(profile ?? false));
    },
    (error) => dispatch(ownFailure(error)),
  );
};

const failed = () =>
  dispatch(
    queueSnackbar(msg("Couldn't save your profile. Try again.", { id: 'store.profiles.failed' })),
  );

/** Saves the visitor's profile. The listener shows it at once, and again if the server refuses it. */
export const setOwnProfile = (
  userId: string,
  { name, photoUrl }: Pick<ProfileData, 'name' | 'photoUrl'>,
): void => saveProfile(userId, { name: name.trim(), photoUrl }, failed);

/**
 * Deletes the visitor's reactions and their profile. It needs their reactions, so it does nothing
 * and returns `false` until those have loaded.
 */
export const deleteOwnProfile = (userId: string): boolean => {
  const own = selectOwnReactionsState(getState());
  if (!(own instanceof Success)) return false;
  deleteProfile(userId, Object.keys(own.data), failed);
  return true;
};

/** Stops listening to the visitor's profile, when they sign out. */
export const resetProfiles = (): void => {
  if (ownSubscription instanceof Success) ownSubscription.data();
  ownSubscription = new Initialized();
  dispatch(ownReset());
};

export const selectProfile = (state: RootState, userId: string): Profile | undefined =>
  state.profiles.byId[userId];

/** Starts listening, once, the first time it's read while signed in. */
export const selectOwnProfileState = (state: RootState): ProfilesState['own'] => {
  if (state.profiles.own instanceof Initialized) subscribeToOwn();
  return state.profiles.own;
};

export default slice.reducer;
