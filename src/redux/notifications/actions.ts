import { Dispatch } from 'redux';
import { db } from '../db';
import { trackError } from '../helpers/actions';
import { setLocation } from '../routing/actions';
import { showToast } from '../toast/actions';
import { NOTIFICATIONS_STATUS, UPDATE_NOTIFICATIONS_STATUS } from './types';

// TODO: Refactor this file

let messaging: firebase.messaging.Messaging;

export const initializeMessaging = () => {
  return new Promise((resolve) => {
    messaging = window.firebase.messaging();
    messaging.onMessage(({ notification }) => {
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
    messaging.onTokenRefresh(() => {
      getToken(true);
    });
    resolve(messaging);
  });
};

export const requestPermission = () => (dispatch: Dispatch) => {
  return messaging
    .requestPermission()
    .then(() => {
      getToken(true);
    })
    .catch((error) => {
      dispatch({
        type: UPDATE_NOTIFICATIONS_STATUS,
        status: NOTIFICATIONS_STATUS.DENIED,
      });

      trackError('notificationActions', 'requestPermission', error);
    });
};

export const getToken = (subscribe = false) => (dispatch: Dispatch, getState) => {
  if (!subscribe && Notification.permission !== 'granted') {
    return;
  }
  messaging
    .getToken()
    .then((currentToken) => {
      if (currentToken) {
        const state = getState();

        const subscribersRef = db().collection('notificationsSubscribers').doc(currentToken);
        const subscribersPromise = subscribersRef.get();

        const userUid = state.user && (state.user.uid || null);

        let userSubscriptionsPromise = Promise.resolve(null);
        let userSubscriptionsRef;
        if (userUid) {
          userSubscriptionsRef = db().collection('notificationsUsers').doc(userUid);
          userSubscriptionsPromise = userSubscriptionsRef.get();
        }

        Promise.all([subscribersPromise, userSubscriptionsPromise]).then(
          ([subscribersSnapshot, userSubscriptionsSnapshot]) => {
            const isDeviceSubscribed = subscribersSnapshot.exists
              ? subscribersSnapshot.data()
              : false;
            const userSubscriptions =
              userSubscriptionsSnapshot && userSubscriptionsSnapshot.exists
                ? userSubscriptionsSnapshot.data()
                : {};

            const isUserSubscribed = !!(
              userSubscriptions.tokens && userSubscriptions.tokens[currentToken]
            );

            if (isDeviceSubscribed) {
              dispatch({
                type: UPDATE_NOTIFICATIONS_STATUS,
                status: NOTIFICATIONS_STATUS.GRANTED,
                token: currentToken,
              });
              if (userUid && !isUserSubscribed) {
                userSubscriptionsRef.set(
                  {
                    tokens: { [currentToken]: true },
                  },
                  { merge: true }
                );
              }
            } else if (!isDeviceSubscribed && subscribe) {
              subscribersRef.set({ value: true });
              if (userUid) {
                userSubscriptionsRef.set(
                  {
                    tokens: { [currentToken]: true },
                  },
                  { merge: true }
                );
              }
              dispatch({
                type: UPDATE_NOTIFICATIONS_STATUS,
                status: NOTIFICATIONS_STATUS.GRANTED,
                token: currentToken,
              });
            }
          }
        );
      } else {
        dispatch({
          type: UPDATE_NOTIFICATIONS_STATUS,
          status: Notification.permission,
          token: null,
        });
      }
    })
    .catch((error) => {
      dispatch({
        type: UPDATE_NOTIFICATIONS_STATUS,
        status: NOTIFICATIONS_STATUS.DENIED,
        token: null,
      });

      trackError('notificationActions', 'getToken', error);
    });
};

export const unsubscribe = (token) => (dispatch: Dispatch) => {
  return messaging.deleteToken(token).then(() => {
    dispatch({
      type: UPDATE_NOTIFICATIONS_STATUS,
      status: NOTIFICATIONS_STATUS.DEFAULT,
      token: null,
    });
  });
};
