import { Failure, Initialized, Pending, type RemoteData, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  removeNotificationsSubscriber,
  saveNotificationsSubscriber,
} from '../../db/notifications-subscribers';
import { dispatch } from '../dispatch';
import { queueSnackbar } from '../snackbars';

export type UpdateNotificationsSubscribersState = RemoteData<Error, string>;

const initialState: UpdateNotificationsSubscribersState = new Initialized();

const slice = createSlice({
  name: 'updateNotificationsSubscribers',
  initialState: initialState as UpdateNotificationsSubscribersState,
  reducers: {
    pending: (): UpdateNotificationsSubscribersState => new Pending(),
    reset: (): UpdateNotificationsSubscribersState => new Initialized(),
    failure: (_state, action: PayloadAction<Error>): UpdateNotificationsSubscribersState =>
      new Failure(action.payload),
    success: (_state, action: PayloadAction<string>): UpdateNotificationsSubscribersState =>
      new Success(action.payload),
  },
});

const { pending, reset, failure, success } = slice.actions;

export const updateNotificationsSubscribers = async (token: string) => {
  dispatch(pending());

  try {
    await saveNotificationsSubscriber(token);

    dispatch(success(token));
    dispatch(
      queueSnackbar(
        msg('General notifications enabled', { id: 'store.notifications.general-enabled' }),
      ),
    );
  } catch (error) {
    dispatch(failure(error as Error));
  }
};

export const clearNotificationsSubscribers = async (token: string) => {
  dispatch(pending());

  try {
    await removeNotificationsSubscriber(token);

    dispatch(reset());
    dispatch(
      queueSnackbar(
        msg('General notifications disabled', { id: 'store.notifications.general-disabled' }),
      ),
    );
  } catch (error) {
    dispatch(failure(error as Error));
  }
};

export default slice.reducer;
