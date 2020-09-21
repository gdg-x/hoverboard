import { doc, getDoc, setDoc } from 'firebase/firestore';
import { deleteToken, getMessaging, getToken, MessagePayload, onMessage } from 'firebase/messaging';
import { Dispatch } from 'redux';
import { store } from '..';
import { log } from '../../console';
import { db, firebaseApp } from '../../firebase';
import { setLocation } from '../routing/actions';
import { showToast } from '../toast/actions';
import {
  NotificationActions,
  NOTIFICATIONS_FAILURE,
  NOTIFICATIONS_STATUS,
  NOTIFICATIONS_SUCCESS,
  REMOVE_NOTIFICATIONS,
} from './types';

console.log('Notification.permission', Notification.permission);
const messaging = getMessaging(firebaseApp);
type ClickActionMessagePayload = MessagePayload & {
  notification: {
    click_action: string;
  };
};

const isGranted = () => Notification.permission === NOTIFICATIONS_STATUS.GRANTED;

onMessage(messaging, (payload) => {
  const { notification } = payload as ClickActionMessagePayload;
  if (!notification) {
    log('Message missing payload');
    return;
  }

  showToast({
    message: `${notification.title} ${notification.body}`,
    action: {
      title: '{$ notifications.toast.title $}',
      callback: () => {
        setLocation(notification.click_action);
      },
    },
  });
});

export const requestPermission = () => async (dispatch: Dispatch<NotificationActions>) => {
  try {
    await Notification.requestPermission();
    store.dispatch(getAndStoreToken(true));
  } catch (error) {
    dispatch({
      type: REMOVE_NOTIFICATIONS,
    });
  }
};

export const getAndStoreToken =
  (subscribe = false) =>
  async (dispatch: Dispatch<NotificationActions>, getState: typeof store.getState) => {
    if (!subscribe && !isGranted()) {
      console.log(`getToken: subscribe ${subscribe} isGranted ${isGranted()}`);
      return;
    }

    try {
      const currentToken = await getToken(messaging);
      const state = getState();

      const userId = 'uid' in state.user ? state.user.uid : undefined;
      const subscribersRef = doc(db, 'notificationsSubscribers', currentToken);
      const userSubscriptionsRef = doc(db, 'notificationsUsers', userId);
      const [subscribersSnapshot, userSubscriptionsSnapshot] = await Promise.all([
        getDoc(subscribersRef),
        getDoc(userSubscriptionsRef),
      ]);
      const isDeviceSubscribed: boolean =
        subscribersSnapshot.exists() && subscribersSnapshot.data().value;
      const userSubscriptions =
        userSubscriptionsSnapshot && userSubscriptionsSnapshot.exists()
          ? userSubscriptionsSnapshot.data()
          : { tokens: {} };

      const isUserSubscribed = currentToken in userSubscriptions.tokens;

      if (isDeviceSubscribed) {
        dispatch({
          type: NOTIFICATIONS_SUCCESS,
          payload: {
            status: NOTIFICATIONS_STATUS.GRANTED,
            token: currentToken,
          },
        });
        if (userId && !isUserSubscribed) {
          setDoc(
            userSubscriptionsRef,
            {
              tokens: { [currentToken]: true },
            },
            { merge: true }
          );
        }
      } else if (!isDeviceSubscribed && subscribe) {
        setDoc(subscribersRef, { value: true });
        if (userId) {
          setDoc(
            userSubscriptionsRef,
            {
              tokens: { [currentToken]: true },
            },
            { merge: true }
          );
        }
        dispatch({
          type: NOTIFICATIONS_SUCCESS,
          payload: {
            status: NOTIFICATIONS_STATUS.GRANTED,
            token: currentToken,
          },
        });
      }
    } catch (error) {
      dispatch({
        type: NOTIFICATIONS_FAILURE,
        payload: error,
      });
    }
  };

export const unsubscribe = () => async (dispatch: Dispatch<NotificationActions>) => {
  await deleteToken(messaging);
  dispatch({
    type: REMOVE_NOTIFICATIONS,
  });
};
