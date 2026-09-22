import { Failure, Initialized, Pending, RemoteData, Success } from '@abraham/remotedata';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { DialogData } from '../../models/dialog-form';
import { subscribeBlock } from '../../utils/data';
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

const setSubscribe = async (data: DialogData): Promise<true> => {
  const id = data.email.replace(/[^\w\s]/gi, '');
  const subscriber = {
    email: data.email,
    firstName: data.firstFieldValue || '',
    lastName: data.secondFieldValue || '',
  };

  await setDoc(doc(db, 'subscribers', id), subscriber);

  return true;
};

export const subscribe = async (data: DialogData) => {
  dispatch(pending());

  try {
    dispatch(success(await setSubscribe(data)));
    dispatch(queueSnackbar(subscribeBlock.toast));
  } catch (error) {
    dispatch(failure(error as Error));
  }
};

export const resetSubscribed = () => dispatch(reset());

export default slice.reducer;
