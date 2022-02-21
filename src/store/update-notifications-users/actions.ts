import { Success } from '@abraham/remotedata';
import { doc, setDoc } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { RootState, store } from '..';
import { db } from '../../firebase';
import { notifications } from '../../utils/data';
import { UserTokensData } from '../notifications-users/state';
import { queueSnackbar } from '../snackbars';
import {
  UpdateNotificationsUsersActions,
  UPDATE_NOTIFICATION_USERS,
  UPDATE_NOTIFICATION_USERS_FAILURE,
  UPDATE_NOTIFICATION_USERS_SUCCESS,
} from './types';

const setNotificationsUsersDoc = async (uid: string, data: UserTokensData): Promise<void> => {
  await setDoc(doc(db, 'notificationsUsers', uid), data);
};

export const updateNotificationsUsers =
  (uid: string, token: string) =>
  async (dispatch: Dispatch<UpdateNotificationsUsersActions>, getState: () => RootState) => {
    dispatch({
      type: UPDATE_NOTIFICATION_USERS,
    });

    try {
      const { notificationsUsers } = getState();
      const tokens = notificationsUsers instanceof Success ? notificationsUsers.data.tokens : {};

      await setNotificationsUsersDoc(uid, { tokens: { ...tokens, [token]: true } });

      dispatch({
        type: UPDATE_NOTIFICATION_USERS_SUCCESS,
        payload: uid,
      });
      store.dispatch(queueSnackbar(notifications.myScheduleEnabled));
    } catch (error) {
      dispatch({
        type: UPDATE_NOTIFICATION_USERS_FAILURE,
        payload: error as Error,
      });
    }
  };

export const removeNotificationsUsers =
  (uid: string, token: string) =>
  async (dispatch: Dispatch<UpdateNotificationsUsersActions>, getState: () => RootState) => {
    dispatch({
      type: UPDATE_NOTIFICATION_USERS,
    });

    try {
      const { notificationsUsers } = getState();
      const oldTokens = notificationsUsers instanceof Success ? notificationsUsers.data.tokens : {};
      const tokens = { ...oldTokens };
      delete tokens[token];
      await setNotificationsUsersDoc(uid, { tokens });

      dispatch({
        type: UPDATE_NOTIFICATION_USERS_SUCCESS,
        payload: uid,
      });
      store.dispatch(queueSnackbar(notifications.myScheduleDisabled));
    } catch (error) {
      dispatch({
        type: UPDATE_NOTIFICATION_USERS_FAILURE,
        payload: error as Error,
      });
    }
  };
