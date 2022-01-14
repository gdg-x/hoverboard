import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { getMessaging, getToken } from 'firebase/messaging';
import { Dispatch } from 'redux';
import { db, firebaseApp } from '../../firebase';
import {
  SET_NOTIFICATION_SUBSCRIBERS,
  SET_NOTIFICATION_SUBSCRIBERS_FAILURE,
  SET_NOTIFICATION_SUBSCRIBERS_SUCCESS,
  NotificationSubscribersActions,
} from './types';

const messaging = getMessaging(firebaseApp);

const setNotificationsSubscribersDoc = async (token: string): Promise<void> => {
  await setDoc(doc(db, 'notificationsSubscribers', token), {
    value: true,
    updatedAt: Timestamp.now(),
  });
};

export const updateNotificationsSubscribers =
  () => async (dispatch: Dispatch<NotificationSubscribersActions>) => {
    dispatch({
      type: SET_NOTIFICATION_SUBSCRIBERS,
    });

    try {
      const token = await getToken(messaging);

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
