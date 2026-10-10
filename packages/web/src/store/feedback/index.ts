import { Failure, Initialized, Pending, type RemoteData, Success } from '@abraham/remotedata';
import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Unsubscribe } from 'firebase/firestore';
import type { RootState } from '..';
import { dispatch } from '../dispatch';
import {
  removeFeedback,
  saveFeedback,
  subscribeToFeedback as subscribeFeedback,
} from '../../db/feedback';
import type { Feedback, FeedbackId } from '../../models/feedback';
import { selectUser, type UserState } from '../user';

export type SessionFeedback = RemoteData<Error, Feedback | false>;

export type FeedbackState = {
  subscription: RemoteData<Error, Unsubscribe>;
  data: RemoteData<Error, Feedback[]>;
};

export const initialState = {
  subscription: new Initialized(),
  data: new Initialized(),
} as FeedbackState;

export const subscribe = (userId: string) => {
  return subscribeFeedback(
    userId,
    (feedbackList) => dispatch(setSuccess(feedbackList)),
    (error) => dispatch(setFailure(error)),
  );
};

/** Saves feedback. The visitor's feedback listener shows it at once, and again if the server refuses it. */
export const setFeedback = (data: Feedback, onRejected: (error: Error) => void): void =>
  saveFeedback(data, onRejected);

export const deleteFeedback = (data: FeedbackId, onRejected: (error: Error) => void): void =>
  removeFeedback(data, onRejected);

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
      state.subscription = new Initialized();
      state.data = new Initialized();
    },
    setSuccess(state, action: PayloadAction<Feedback[]>) {
      state.data = new Success(action.payload);
    },
    setFailure(state, action: PayloadAction<Error>) {
      state.data = new Failure(action.payload);
    },
  },
});

const { subscribeToFeedback, unsubscribeFromFeedback, setSuccess, setFailure } =
  feedbackSlice.actions;

const selectParentId = (_state: RootState, parentId: string | undefined) => parentId;
export const selectFeedbackSubscription = (state: RootState) => state.feedback.subscription;
export const selectFeedback = (state: RootState) => state.feedback.data;

const selectSubscription = createSelector(
  selectUser,
  selectFeedbackSubscription,
  (user: UserState, subscription: FeedbackState['subscription']): FeedbackState['subscription'] => {
    if (user instanceof Success && subscription instanceof Initialized) {
      dispatch(subscribeToFeedback(user.data.uid));
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
