import { deleteDoc, doc, setDoc, Timestamp } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { db } from '../../firebase';
import {
  NotificationSubscribersActions,
  RESET_NOTIFICATION_SUBSCRIBERS,
  SET_NOTIFICATION_SUBSCRIBERS,
  SET_NOTIFICATION_SUBSCRIBERS_FAILURE,
  SET_NOTIFICATION_SUBSCRIBERS_SUCCESS,
} from './types';

// TODO: live update
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
  (token: string) => async (dispatch: Dispatch<NotificationSubscribersActions>) => {
    dispatch({
      type: SET_NOTIFICATION_SUBSCRIBERS,
    });

    try {
      await setNotificationsSubscribersDoc(token);

      dispatch({
        type: SET_NOTIFICATION_SUBSCRIBERS_SUCCESS,
        payload: token,
      });
    } catch (error) {
      dispatch({
        type: SET_NOTIFICATION_SUBSCRIBERS_FAILURE,
        payload: error,
      });
    }
  };

export const clearNotificationsSubscribers =
  (token: string) => async (dispatch: Dispatch<NotificationSubscribersActions>) => {
    dispatch({
      type: SET_NOTIFICATION_SUBSCRIBERS,
    });

    try {
      await removeNotificationsSubscribersDoc(token);

      dispatch({
        type: RESET_NOTIFICATION_SUBSCRIBERS,
      });
    } catch (error) {
      dispatch({
        type: SET_NOTIFICATION_SUBSCRIBERS_FAILURE,
        payload: error,
      });
    }
  };
