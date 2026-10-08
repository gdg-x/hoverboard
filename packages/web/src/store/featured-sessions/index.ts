import { Failure, Initialized, Pending, type RemoteData, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '..';
import {
  fetchFeaturedSessions as getFeaturedSessions,
  type FeaturedSessions,
  saveFeaturedSessions,
} from '../../db/featured-sessions';
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

const fetchUserFeaturedSessions = async () => {
  const userId = selectUserId(getState());

  if (!userId) return;

  dispatch(pending());

  try {
    dispatch(success(await getFeaturedSessions(userId)));
  } catch (error) {
    dispatch(failure(error as Error));
  }
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
  dispatch(reset());
};

/** Triggers the fetch (once) the first time state is read, mirroring the
 * "select and lazily fetch" idiom used across the store. */
export const selectFeaturedSessionsState = (state: RootState): FeaturedSessionsState => {
  const { featuredSessions } = state;
  if (featuredSessions instanceof Initialized) {
    fetchUserFeaturedSessions();
  }
  return featuredSessions;
};

export const selectFeaturedSessions = (state: RootState): FeaturedSessions => {
  const featuredSessions = selectFeaturedSessionsState(state);
  return featuredSessions instanceof Success ? featuredSessions.data : {};
};

export default slice.reducer;
