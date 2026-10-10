import { Failure, Initialized, type RemoteData, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { saveSubscriber } from '../../db/subscribers';
import type { DialogData } from '../../models/dialog-form';
import { dispatch } from '../dispatch';
import { queueSnackbar } from '../snackbars';
import { canWriteNow } from '../sync';

export type SubscribeState = RemoteData<Error, true>;

const initialState: SubscribeState = new Initialized();

const slice = createSlice({
  name: 'subscribe',
  initialState: initialState as SubscribeState,
  reducers: {
    success: (_state, action: PayloadAction<true>): SubscribeState => new Success(action.payload),
    failure: (_state, action: PayloadAction<Error>): SubscribeState => new Failure(action.payload),
    reset: (): SubscribeState => new Initialized(),
  },
});

const { success, failure, reset } = slice.actions;

/** Sends the form, without waiting for the server. Visitors without an account need the network. */
export const subscribe = (data: DialogData): void => {
  if (!canWriteNow()) {
    dispatch(failure(new Error('Offline')));
    return;
  }
  saveSubscriber(data, (error) => dispatch(failure(error)));
  dispatch(success(true));
  dispatch(queueSnackbar(msg('Successfully subscribed!', { id: 'store.subscribe.success' })));
};

export const resetSubscribed = () => dispatch(reset());

export default slice.reducer;
