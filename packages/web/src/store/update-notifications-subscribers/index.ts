import { Failure, Initialized, type RemoteData, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  removeNotificationsSubscriber,
  saveNotificationsSubscriber,
} from '../../db/notifications-subscribers';
import { dispatch } from '../dispatch';
import { queueSnackbar } from '../snackbars';
import { canWriteNow } from '../sync';

export type UpdateNotificationsSubscribersState = RemoteData<Error, string>;

const initialState: UpdateNotificationsSubscribersState = new Initialized();

const slice = createSlice({
  name: 'updateNotificationsSubscribers',
  initialState: initialState as UpdateNotificationsSubscribersState,
  reducers: {
    reset: (): UpdateNotificationsSubscribersState => new Initialized(),
    failure: (_state, action: PayloadAction<Error>): UpdateNotificationsSubscribersState =>
      new Failure(action.payload),
    success: (_state, action: PayloadAction<string>): UpdateNotificationsSubscribersState =>
      new Success(action.payload),
  },
});

const { reset, failure, success } = slice.actions;

// The device's token isn't tied to an account, so changing it needs the network.
export const updateNotificationsSubscribers = (token: string): void => {
  if (!canWriteNow()) return;
  saveNotificationsSubscriber(token, (error) => dispatch(failure(error)));
  dispatch(success(token));
  dispatch(
    queueSnackbar(
      msg('General notifications enabled', { id: 'store.notifications.general-enabled' }),
    ),
  );
};

export const clearNotificationsSubscribers = (token: string): void => {
  if (!canWriteNow()) return;
  removeNotificationsSubscriber(token, (error) => dispatch(failure(error)));
  dispatch(reset());
  dispatch(
    queueSnackbar(
      msg('General notifications disabled', { id: 'store.notifications.general-disabled' }),
    ),
  );
};

export default slice.reducer;
