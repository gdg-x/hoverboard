import { Failure, Initialized, Pending, RemoteData, Success } from '@abraham/remotedata';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';
import { dispatch } from '../dispatch';
import { subscribeToDocument, Subscription } from '../../utils/firestore';

export interface UserTokens {
  id: string;
  tokens: {
    [key: string]: true;
  };
}

export type UserTokensData = Omit<UserTokens, 'id'>;

export type NotificationsUsersState = RemoteData<Error, UserTokens>;

const initialState: NotificationsUsersState = new Initialized();

const slice = createSlice({
  name: 'notificationsUsers',
  initialState: initialState as NotificationsUsersState,
  reducers: {
    pending: (): NotificationsUsersState => new Pending(),
    failure: (_state, action: PayloadAction<Error>): NotificationsUsersState =>
      new Failure(action.payload),
    success: (_state, action: PayloadAction<UserTokens>): NotificationsUsersState =>
      new Success(action.payload),
  },
});

const { pending, failure, success } = slice.actions;

let subscription: Subscription = new Initialized();

const fetchNotificationsUsers = (uid: string) => {
  if (subscription instanceof Initialized) {
    subscription = subscribeToDocument<UserTokens>(
      `notificationsUsers/${uid}`,
      () => dispatch(pending()),
      (payload) => dispatch(success(payload || { id: uid, tokens: {} })),
      (payload: Error) => dispatch(failure(payload)),
    );
  }
};

export const selectNotificationsUsersSubscribed = (state: RootState): boolean => {
  if (
    state.notificationPermission.value instanceof Success &&
    state.user instanceof Success &&
    state.notificationsUsers instanceof Initialized
  ) {
    fetchNotificationsUsers(state.user.data.uid);
    return false;
  } else if (
    state.notificationPermission.value instanceof Success &&
    state.notificationsUsers instanceof Success
  ) {
    return state.notificationPermission.value.data in state.notificationsUsers.data.tokens;
  } else {
    return false;
  }
};

export default slice.reducer;
