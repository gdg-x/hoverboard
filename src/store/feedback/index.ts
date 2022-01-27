import { Failure, Initialized, Pending, RemoteData, Success } from '@abraham/remotedata';
import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  collectionGroup,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  Unsubscribe,
  where,
} from 'firebase/firestore';
import { RootState, store } from '..';
import { db } from '../../firebase';
import { Feedback, FeedbackId } from '../../models/feedback';
import { dataWithParentId } from '../../utils/firestore';
import { SimpleRemoteData } from '../../utils/simple-remote-data';
import { selectUser } from '../user/selectors';
import { UserState } from '../user/types';

export type FeedbackState = {
  set: SimpleRemoteData<FeedbackId>;
  data: SimpleRemoteData<Feedback[]>;
  remove: SimpleRemoteData<FeedbackId>;
  subscription: SimpleRemoteData<Unsubscribe>;
};

export const initialState = {
  set: { kind: 'initialized' },
  data: { kind: 'initialized' },
  remove: { kind: 'initialized' },
  subscription: { kind: 'initialized' },
} as FeedbackState;

export const subscribe = (userId: string) => {
  return onSnapshot(
    query(collectionGroup(db, 'feedback'), where('userId', '==', userId)),
    (snapshot) => store.dispatch(setSuccess(snapshot.docs.map<Feedback>(dataWithParentId))),
    (error) => store.dispatch(setFailure(error as Error))
  );
};

export const setFeedback = createAsyncThunk<FeedbackId, Feedback>(
  'feedback/set',
  async (data: Feedback) => {
    await setDoc(doc(db, 'sessions', data.parentId, 'feedback', data.userId), {
      contentRating: data.contentRating,
      styleRating: data.styleRating,
      comment: data.comment,
      userId: data.userId,
    });

    return {
      parentId: data.parentId,
      userId: data.userId,
      id: data.userId,
    };
  }
);

export const removeFeedback = createAsyncThunk<FeedbackId, FeedbackId>(
  'feedback/remove',
  async (data: FeedbackId) => {
    await deleteDoc(doc(db, 'sessions', data.parentId, 'feedback', data.userId));

    return data;
  }
);

const feedbackSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {
    clear(state) {
      state.set = { kind: 'initialized' };
      state.data = { kind: 'initialized' };
      state.remove = { kind: 'initialized' };
      state.subscription = { kind: 'initialized' };
    },
    subscribeToFeedback(state, action: PayloadAction<string>) {
      if (state.subscription.kind === 'initialized') {
        state.subscription = { kind: 'success', data: subscribe(action.payload) };
        state.data = { kind: 'pending' };
      }
    },
    unsubscribeFromFeedback(state) {
      if (state.subscription.kind === 'success') {
        state.subscription.data();
      }
      clear();
    },
    setSuccess(state, action: PayloadAction<Feedback[]>) {
      state.set = { kind: 'initialized' };
      state.data = { kind: 'success', data: action.payload };
      state.remove = { kind: 'initialized' };
    },
    setFailure(state, action: PayloadAction<Error>) {
      state.set = { kind: 'initialized' };
      state.data = { kind: 'failure', error: action.payload };
      state.remove = { kind: 'initialized' };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(setFeedback.pending, (state) => {
        state.set = { kind: 'pending' };
      })
      .addCase(setFeedback.fulfilled, (state, action) => {
        state.set = { kind: 'success', data: action.payload };
      })
      .addCase(setFeedback.rejected, (state, action) => {
        state.set = { kind: 'failure', error: new Error(action.error.message) };
      })
      .addCase(removeFeedback.pending, (state) => {
        state.remove = { kind: 'pending' };
      })
      .addCase(removeFeedback.fulfilled, (state, action) => {
        state.remove = { kind: 'success', data: action.payload };
      })
      .addCase(removeFeedback.rejected, (state, action) => {
        state.remove = { kind: 'failure', error: new Error(action.error.message) };
      });
  },
});

const { clear, subscribeToFeedback, unsubscribeFromFeedback, setSuccess, setFailure } =
  feedbackSlice.actions;

export const selectSetFeedback = (state: RootState) => state.feedback.set;
export const selectFeedback = (state: RootState) => state.feedback.data;
export const selectSubscriptionValue = (state: RootState) => state.feedback.subscription;

export const selectFeedbackById = createSelector(
  (_state: RootState, parentId: string | undefined) => parentId,
  selectFeedback,
  (
    parentId: string | undefined,
    feedback: FeedbackState['data']
  ): RemoteData<Error, Feedback | false> => {
    if (feedback.kind === 'success') {
      return new Success(feedback.data.find((review) => review.parentId === parentId) ?? false);
    } else if (feedback.kind === 'pending') {
      return new Pending();
    } else if (feedback.kind === 'failure') {
      return new Failure(feedback.error);
    } else {
      return new Initialized();
    }
  }
);

export const selectSubscription = createSelector(
  selectUser,
  selectSubscriptionValue,
  (user: UserState, subscription: FeedbackState['subscription']): FeedbackState['subscription'] => {
    if (user instanceof Success && subscription.kind === 'initialized') {
      store.dispatch(subscribeToFeedback(user.data.uid));
      return { kind: 'pending' };
    } else {
      return subscription;
    }
  }
);

export const selectRemoveFeedback = (state: RootState) => state.feedback.remove;

export { subscribeToFeedback, unsubscribeFromFeedback };
export default feedbackSlice.reducer;
