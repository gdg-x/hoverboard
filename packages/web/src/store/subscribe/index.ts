import { Failure, Initialized, Pending, type RemoteData, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { saveSubscriber } from '../../db/subscribers';
import type { DialogData } from '../../models/dialog-form';
import { dispatch } from '../dispatch';
import { queueSnackbar } from '../snackbars';

export type SubscribeState = RemoteData<Error, true>;

const initialState: SubscribeState = new Initialized();

const slice = createSlice({
  name: 'subscribe',
  initialState: initialState as SubscribeState,
  reducers: {
    pending: (): SubscribeState => new Pending(),
    success: (_state, action: PayloadAction<true>): SubscribeState => new Success(action.payload),
    failure: (_state, action: PayloadAction<Error>): SubscribeState => new Failure(action.payload),
    reset: (): SubscribeState => new Initialized(),
  },
});

const { pending, success, failure, reset } = slice.actions;

export const subscribe = async (data: DialogData) => {
  dispatch(pending());

  try {
    dispatch(success(await saveSubscriber(data)));
    dispatch(queueSnackbar(msg('Successfully subscribed!', { id: 'store.subscribe.success' })));
  } catch (error) {
    dispatch(failure(error as Error));
  }
};

export const resetSubscribed = () => dispatch(reset());

export default slice.reducer;
