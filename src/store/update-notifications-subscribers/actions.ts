import { deleteDoc, doc, setDoc, Timestamp } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { db } from '../../firebase';
import { showSimpleToast } from '../toast/actions';
import {
  UpdateNotificationsSubscribersActions,
  RESET_UPDATE_NOTIFICATIONS_SUBSCRIBERS,
  UPDATE_NOTIFICATION_SUBSCRIBERS,
  UPDATE_NOTIFICATION_SUBSCRIBERS_FAILURE,
  UPDATE_NOTIFICATION_SUBSCRIBERS_SUCCESS,
} from './types';

const setNotificationsSubscribersDoc = async (token: string): Promise<void> => {
  await setDoc(doc(db, 'notificationsSubscribers', token), {
    value: true,
    updatedAt: Timestamp.now(),
  });
};

const removeNotificationsSubscribersDoc = async (token: string): Promise<void> => {
  await deleteDoc(doc(db, 'notificationsSubscribers', token));
};

export const updateNotificationsSubscribers =
  (token: string) => async (dispatch: Dispatch<UpdateNotificationsSubscribersActions>) => {
    dispatch({
      type: UPDATE_NOTIFICATION_SUBSCRIBERS,
    });

    try {
      await setNotificationsSubscribersDoc(token);

      dispatch({
        type: UPDATE_NOTIFICATION_SUBSCRIBERS_SUCCESS,
        payload: token,
      });
      showSimpleToast('{$ notifications.generalEnabled $}');
    } catch (error) {
      dispatch({
        type: UPDATE_NOTIFICATION_SUBSCRIBERS_FAILURE,
        payload: error as Error,
      });
    }
  };

export const clearNotificationsSubscribers =
  (token: string) => async (dispatch: Dispatch<UpdateNotificationsSubscribersActions>) => {
    dispatch({
      type: UPDATE_NOTIFICATION_SUBSCRIBERS,
    });

    try {
      await removeNotificationsSubscribersDoc(token);

      dispatch({
        type: RESET_UPDATE_NOTIFICATIONS_SUBSCRIBERS,
      });
      showSimpleToast('{$ notifications.generalDisabled $}');
    } catch (error) {
      dispatch({
        type: UPDATE_NOTIFICATION_SUBSCRIBERS_FAILURE,
        payload: error as Error,
      });
    }
  };
