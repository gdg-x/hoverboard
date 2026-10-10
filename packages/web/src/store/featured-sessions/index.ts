import { Failure, Initialized, Pending, type RemoteData, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '..';
import {
  type FeaturedSessions,
  saveFeaturedSessions,
  subscribeToFeaturedSessions,
} from '../../db/featured-sessions';
import type { Subscription } from '../../utils/firestore';
import { dispatch, getState } from '../dispatch';
import { queueSnackbar } from '../snackbars';
import { selectUserId } from '../user';

export type { FeaturedSessions };

export type FeaturedSessionsState = RemoteData<Error, FeaturedSessions>;

const initialState: FeaturedSessionsState = new Initialized();

const slice = createSlice({
  name: 'featuredSessions',
  initialState: initialState as FeaturedSessionsState,
  reducers: {
    pending: (): FeaturedSessionsState => new Pending(),
    success: (_state, action: PayloadAction<FeaturedSessions>): FeaturedSessionsState =>
      new Success(action.payload),
    failure: (_state, action: PayloadAction<Error>): FeaturedSessionsState =>
      new Failure(action.payload),
    reset: (): FeaturedSessionsState => new Initialized(),
  },
});

const { pending, success, failure, reset } = slice.actions;

let subscription: Subscription = new Initialized();

const subscribeToUserFeaturedSessions = () => {
  const userId = selectUserId(getState());
  if (!userId || !(subscription instanceof Initialized)) return;

  subscription = subscribeToFeaturedSessions(
    userId,
    () => dispatch(pending()),
    (featuredSessions) => dispatch(success(featuredSessions)),
    (error) => dispatch(failure(error)),
  );
};

const cleanFeaturedSessions = (object: FeaturedSessions): FeaturedSessions => {
  const hasValue = ([, value]: [string, unknown]) => Boolean(value);
  return Object.fromEntries(Object.entries(object).filter(hasValue));
};

export const setUserFeaturedSessions = async (
  userId: string,
  featuredSessions: FeaturedSessions,
  isBookmarked: boolean,
) => {
  dispatch(pending());

  try {
    const cleanedFeaturedSessions = cleanFeaturedSessions(featuredSessions);
    await saveFeaturedSessions(userId, cleanedFeaturedSessions);
    dispatch(success(cleanedFeaturedSessions));
    dispatch(
      queueSnackbar(
        isBookmarked
          ? msg('Session saved to My Schedule', { id: 'store.featured-sessions.added' })
          : msg('Session removed from My Schedule', { id: 'store.featured-sessions.removed' }),
      ),
    );
  } catch (error) {
    dispatch(failure(error as Error));
  }
};

export const resetFeaturedSessions = () => {
  if (subscription instanceof Success) subscription.data();
  subscription = new Initialized();
  dispatch(reset());
};

/** Starts listening (once) the first time state is read, mirroring the
 * "select and lazily fetch" idiom used across the store. */
export const selectFeaturedSessionsState = (state: RootState): FeaturedSessionsState => {
  const { featuredSessions } = state;
  if (featuredSessions instanceof Initialized) {
    subscribeToUserFeaturedSessions();
  }
  return featuredSessions;
};

export const selectFeaturedSessions = (state: RootState): FeaturedSessions => {
  const featuredSessions = selectFeaturedSessionsState(state);
  return featuredSessions instanceof Success ? featuredSessions.data : {};
};

export default slice.reducer;
