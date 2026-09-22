import { Failure, Initialized, Pending, RemoteData, Success } from '@abraham/remotedata';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { notifications } from '../../utils/data';
import { dispatch, getState } from '../dispatch';
import { UserTokensData } from '../notifications-users';
import { queueSnackbar } from '../snackbars';

export type UpdateNotificationsUsersState = RemoteData<Error, string>;

const initialState: UpdateNotificationsUsersState = new Initialized();

const slice = createSlice({
  name: 'updateNotificationsUsers',
  initialState: initialState as UpdateNotificationsUsersState,
  reducers: {
    pending: (): UpdateNotificationsUsersState => new Pending(),
    failure: (_state, action: PayloadAction<Error>): UpdateNotificationsUsersState =>
      new Failure(action.payload),
    success: (_state, action: PayloadAction<string>): UpdateNotificationsUsersState =>
      new Success(action.payload),
  },
});

const { pending, failure, success } = slice.actions;

const setNotificationsUsersDoc = async (uid: string, data: UserTokensData): Promise<void> => {
  await setDoc(doc(db, 'notificationsUsers', uid), data);
};

export const updateNotificationsUsers = async (uid: string, token: string) => {
  dispatch(pending());

  try {
    const { notificationsUsers } = getState();
    const tokens = notificationsUsers instanceof Success ? notificationsUsers.data.tokens : {};

    await setNotificationsUsersDoc(uid, { tokens: { ...tokens, [token]: true } });

    dispatch(success(uid));
    dispatch(queueSnackbar(notifications.myScheduleEnabled));
  } catch (error) {
    dispatch(failure(error as Error));
  }
};

export const removeNotificationsUsers = async (uid: string, token: string) => {
  dispatch(pending());

  try {
    const { notificationsUsers } = getState();
    const oldTokens = notificationsUsers instanceof Success ? notificationsUsers.data.tokens : {};
    const tokens = { ...oldTokens };
    delete tokens[token];
    await setNotificationsUsersDoc(uid, { tokens });

    dispatch(success(uid));
    dispatch(queueSnackbar(notifications.myScheduleDisabled));
  } catch (error) {
    dispatch(failure(error as Error));
  }
};

export default slice.reducer;
