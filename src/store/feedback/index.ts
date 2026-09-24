import { Failure, Initialized, Pending, RemoteData, Success } from '@abraham/remotedata';
import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Unsubscribe } from 'firebase/firestore';
import { RootState, store } from '..';
import {
  removeFeedback,
  saveFeedback,
  subscribeToFeedback as subscribeFeedback,
} from '../../db/feedback';
import { Feedback, FeedbackId } from '../../models/feedback';
import { selectUser, UserState } from '../user';

export type SessionFeedback = RemoteData<Error, Feedback | false>;

export type FeedbackState = {
  set: RemoteData<Error, FeedbackId>;
  subscription: RemoteData<Error, Unsubscribe>;
  data: RemoteData<Error, Feedback[]>;
  delete: RemoteData<Error, FeedbackId>;
};

export const initialState = {
  set: new Initialized(),
  subscription: new Initialized(),
  data: new Initialized(),
  delete: new Initialized(),
} as FeedbackState;

export const subscribe = (userId: string) => {
  return subscribeFeedback(
    userId,
    (feedbackList) => store.dispatch(setSuccess(feedbackList)),
    (error) => store.dispatch(setFailure(error)),
  );
};

export const setFeedback = createAsyncThunk<FeedbackId, Feedback>(
  'feedback/set',
  async (data: Feedback) => {
    return saveFeedback(data);
  },
);

export const deleteFeedback = createAsyncThunk<FeedbackId, FeedbackId>(
  'feedback/delete',
  async (data: FeedbackId) => {
    return removeFeedback(data);
  },
);

const feedbackSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {
    subscribeToFeedback(state, action: PayloadAction<string>) {
      if (state.subscription instanceof Initialized) {
        state.subscription = new Success(subscribe(action.payload));
        state.data = new Pending();
      }
    },
    unsubscribeFromFeedback(state) {
      if (state.subscription instanceof Success) {
        state.subscription.data();
      }
      state.set = new Initialized();
      state.subscription = new Initialized();
      state.data = new Initialized();
      state.delete = new Initialized();
    },
    setSuccess(state, action: PayloadAction<Feedback[]>) {
      state.data = new Success(action.payload);
    },
    setFailure(state, action: PayloadAction<Error>) {
      state.data = new Failure(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(setFeedback.pending, (state) => {
        state.set = new Pending();
      })
      .addCase(setFeedback.fulfilled, (state, action) => {
        state.set = new Success(action.payload);
      })
      .addCase(setFeedback.rejected, (state, action) => {
        state.set = new Failure(new Error(action.error.message));
      })
      .addCase(deleteFeedback.pending, (state) => {
        state.delete = new Pending();
      })
      .addCase(deleteFeedback.fulfilled, (state, action) => {
        state.delete = new Success(action.payload);
      })
      .addCase(deleteFeedback.rejected, (state, action) => {
        state.delete = new Failure(new Error(action.error.message));
      });
  },
});

const { subscribeToFeedback, unsubscribeFromFeedback, setSuccess, setFailure } =
  feedbackSlice.actions;

const selectParentId = (_state: RootState, parentId: string | undefined) => parentId;
export const selectFeedbackSet = (state: RootState) => state.feedback.set;
export const selectFeedbackSubscription = (state: RootState) => state.feedback.subscription;
export const selectFeedback = (state: RootState) => state.feedback.data;
export const selectFeedbackDelete = (state: RootState) => state.feedback.delete;

const selectSubscription = createSelector(
  selectUser,
  selectFeedbackSubscription,
  (user: UserState, subscription: FeedbackState['subscription']): FeedbackState['subscription'] => {
    if (user instanceof Success && subscription instanceof Initialized) {
      store.dispatch(subscribeToFeedback(user.data.uid));
      return new Pending();
    } else {
      return subscription;
    }
  },
);

export const selectFeedbackById = createSelector(
  selectParentId,
  selectSubscription,
  selectFeedback,
  (
    parentId: string | undefined,
    subscription: FeedbackState['subscription'],
    feedback: FeedbackState['data'],
  ): SessionFeedback => {
    if (feedback instanceof Success) {
      return new Success(feedback.data.find((review) => review.parentId === parentId) ?? false);
    } else if (subscription instanceof Pending || subscription instanceof Success) {
      return new Pending();
    } else {
      return feedback;
    }
  },
);

export { unsubscribeFromFeedback };
export default feedbackSlice.reducer;
