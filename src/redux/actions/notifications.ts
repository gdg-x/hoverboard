import { NOTIFICATIONS_STATUS, UPDATE_NOTIFICATIONS_STATUS } from '../constants';
import { db } from '../db';
import { store } from '../store';
import { helperActions } from './helper';
import { routingActions } from './routing';
import { toastActions } from './toast';

let messaging;
export const notificationsActions = {
  initializeMessaging: () => {
    return new Promise((resolve) => {
      messaging = window.firebase.messaging();
      messaging.onMessage(({ notification }) => {
        toastActions.showToast({
          message: `${notification.title} ${notification.body}`,
          action: {
            title: '{$ notifications.toast.title $}',
            callback: () => {
              routingActions.setLocation(notification.click_action);
            },
          },
        });
      });
      messaging.onTokenRefresh(() => {
        store.dispatch(notificationsActions.getToken(true));
      });
      resolve(messaging);
    });
  },
  requestPermission: () => (dispatch) => {
    return messaging
      .requestPermission()
      .then(() => {
        dispatch(notificationsActions.getToken(true));
      })
      .catch((error) => {
        dispatch({
          type: UPDATE_NOTIFICATIONS_STATUS,
          status: NOTIFICATIONS_STATUS.DENIED,
        });

        helperActions.trackError('notificationActions', 'requestPermission', error);
      });
  },

  getToken: (subscribe = false) => (dispatch, getState) => {
    if (!subscribe && Notification.permission !== 'granted') {
      return;
    }
    return messaging
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

        helperActions.trackError('notificationActions', 'getToken', error);
      });
  },

  unsubscribe: (token) => (dispatch) => {
    return messaging.deleteToken(token).then(() => {
      dispatch({
        type: UPDATE_NOTIFICATIONS_STATUS,
        status: NOTIFICATIONS_STATUS.DEFAULT,
        token: null,
      });
    });
  },
};
