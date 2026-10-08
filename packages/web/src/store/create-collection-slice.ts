import { Failure, Initialized, Pending, type RemoteData, Success } from '@abraham/remotedata';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { registerContentSubscriber, seedContent } from './content';
import { dispatch } from './dispatch';
import type { Subscription } from '../utils/firestore';

export type CollectionState<T> = RemoteData<Error, T[]>;

/**
 * Shared factory for the common "subscribe to a Firestore collection (or
 * collection group) and store the results as RemoteData<Error, T[]>" slice
 * shape used by most read-only list slices (blog, gallery, videos, etc).
 *
 * `subscribeToSource` should call one of subscribeToCollection /
 * subscribeToCollectionGroup (or a custom query) with the given callbacks.
 */
export const createCollectionSlice = <T>(
  name: string,
  subscribeToSource: (
    onStart: () => void,
    onNext: (payload: T[]) => void,
    onError: (error: Error) => void,
  ) => Subscription,
) => {
  const initialState: CollectionState<T> = new Initialized();

  const slice = createSlice({
    name,
    initialState: initialState as CollectionState<T>,
    reducers: {
      // Seeded data stays on screen while the subscription starts.
      pending: (state): CollectionState<T> => (state instanceof Success ? state : new Pending()),
      success: (_state, action: PayloadAction<T[]>): CollectionState<T> =>
        new Success<T[]>(action.payload),
      failure: (_state, action: PayloadAction<Error>): CollectionState<T> =>
        new Failure<Error>(action.payload),
    },
    extraReducers: (builder) => {
      builder.addCase(seedContent, (state, { payload }) => {
        const data = (payload as Partial<Record<string, T[]>>)[name];
        // RemoteData classes are not drafted, so `state` is the current value itself.
        return data ? new Success(data) : (state as CollectionState<T>);
      });
    },
  });

  const { pending, success, failure } = slice.actions;

  let subscription: Subscription = new Initialized();

  const fetch = () => {
    if (subscription instanceof Initialized) {
      subscription = subscribeToSource(
        () => dispatch(pending()),
        (payload) => dispatch(success(payload)),
        (error) => dispatch(failure(error)),
      );
    }
  };

  const unsubscribe = () => {
    if (subscription instanceof Success) {
      subscription.data();
    }
    subscription = new Initialized();
  };

  registerContentSubscriber(name, fetch);

  /** Triggers the subscription (once) the first time state is read, mirroring the
   * "select and lazily fetch" idiom used across the store. */
  const selectOrFetch = (state: CollectionState<T>): CollectionState<T> => {
    if (state instanceof Initialized) {
      fetch();
      return new Pending();
    }
    return state;
  };

  return { reducer: slice.reducer, fetch, unsubscribe, selectOrFetch };
};
