import { Failure, Initialized, type RemoteData, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { saveNotificationsUsers } from '../../db/notifications-users';
import { dispatch, getState } from '../dispatch';
import { queueSnackbar } from '../snackbars';

export type UpdateNotificationsUsersState = RemoteData<Error, string>;

const initialState: UpdateNotificationsUsersState = new Initialized();

const slice = createSlice({
  name: 'updateNotificationsUsers',
  initialState: initialState as UpdateNotificationsUsersState,
  reducers: {
    failure: (_state, action: PayloadAction<Error>): UpdateNotificationsUsersState =>
      new Failure(action.payload),
    success: (_state, action: PayloadAction<string>): UpdateNotificationsUsersState =>
      new Success(action.payload),
  },
});

const { failure, success } = slice.actions;

const tokensNow = () => {
  const { notificationsUsers } = getState();
  return notificationsUsers instanceof Success ? notificationsUsers.data.tokens : {};
};

/** Saves the token for session reminders. Works offline, since the document is the visitor's own. */
export const updateNotificationsUsers = (uid: string, token: string): void => {
  saveNotificationsUsers(uid, { tokens: { ...tokensNow(), [token]: true } }, (error) =>
    dispatch(failure(error)),
  );
  dispatch(success(uid));
  dispatch(
    queueSnackbar(
      msg('My Schedule notifications enabled', {
        id: 'store.notifications.my-schedule-enabled',
      }),
    ),
  );
};

export const removeNotificationsUsers = (uid: string, token: string): void => {
  const tokens = { ...tokensNow() };
  delete tokens[token];
  saveNotificationsUsers(uid, { tokens }, (error) => dispatch(failure(error)));
  dispatch(success(uid));
  dispatch(
    queueSnackbar(
      msg('My Schedule notifications disabled', {
        id: 'store.notifications.my-schedule-disabled',
      }),
    ),
  );
};

export default slice.reducer;
