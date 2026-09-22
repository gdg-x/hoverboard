import { Failure, Initialized, Pending, RemoteData, Success } from '@abraham/remotedata';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { deleteDoc, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { notifications } from '../../utils/data';
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

const setNotificationsSubscribersDoc = async (token: string): Promise<void> => {
  await setDoc(doc(db, 'notificationsSubscribers', token), {
    value: true,
    updatedAt: Timestamp.now(),
  });
};

const removeNotificationsSubscribersDoc = async (token: string): Promise<void> => {
  await deleteDoc(doc(db, 'notificationsSubscribers', token));
};

export const updateNotificationsSubscribers = async (token: string) => {
  dispatch(pending());

  try {
    await setNotificationsSubscribersDoc(token);

    dispatch(success(token));
    dispatch(queueSnackbar(notifications.generalEnabled));
  } catch (error) {
    dispatch(failure(error as Error));
  }
};

export const clearNotificationsSubscribers = async (token: string) => {
  dispatch(pending());

  try {
    await removeNotificationsSubscribersDoc(token);

    dispatch(reset());
    dispatch(queueSnackbar(notifications.generalDisabled));
  } catch (error) {
    dispatch(failure(error as Error));
  }
};

export default slice.reducer;
