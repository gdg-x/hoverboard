import { Failure, Initialized, Pending, RemoteData, Success } from '@abraham/remotedata';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';
import { dispatch } from '../dispatch';
import { subscribeToDocument, Subscription } from '../../utils/firestore';

export type NotificationsSubscribersState = RemoteData<Error, string | undefined>;

export const initialNotificationsSubscribersState: NotificationsSubscribersState =
  new Initialized();
const initialState = initialNotificationsSubscribersState;

const slice = createSlice({
  name: 'notificationsSubscribers',
  initialState: initialState as NotificationsSubscribersState,
  reducers: {
    pending: (): NotificationsSubscribersState => new Pending(),
    failure: (_state, action: PayloadAction<Error>): NotificationsSubscribersState =>
      new Failure(action.payload),
    success: (_state, action: PayloadAction<string | undefined>): NotificationsSubscribersState =>
      new Success(action.payload),
  },
});

const { pending, failure, success } = slice.actions;

let subscription: Subscription = new Initialized();

const fetchNotificationsSubscribers = (token: string) => {
  if (subscription instanceof Initialized) {
    subscription = subscribeToDocument<{ id: string | undefined }>(
      `notificationsSubscribers/${token}`,
      () => dispatch(pending()),
      (payload) => dispatch(success(payload?.id || '')),
      (payload: Error) => dispatch(failure(payload)),
    );
  }
};

export const selectNotificationsSubscribers = (state: RootState): NotificationsSubscribersState => {
  if (
    state.notificationPermission.value instanceof Success &&
    state.notificationsSubscribers instanceof Initialized
  ) {
    fetchNotificationsSubscribers(state.notificationPermission.value.data);
    return new Pending();
  } else {
    return state.notificationsSubscribers;
  }
};

export default slice.reducer;
