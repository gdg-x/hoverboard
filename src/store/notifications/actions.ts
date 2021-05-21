import { doc, DocumentReference, DocumentSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { deleteToken, getMessaging, getToken as fbGetToken, onMessage } from 'firebase/messaging';
import { Dispatch } from 'redux';
import { store } from '..';
import { log } from '../../console';
import { db, firebaseApp } from '../../firebase';
import { TempAny } from '../../temp-any';
import { setLocation } from '../routing/actions';
import { showToast } from '../toast/actions';
import { NOTIFICATIONS_STATUS, UPDATE_NOTIFICATIONS_STATUS } from './types';

// TODO: Refactor this file

const messaging = getMessaging(firebaseApp);

onMessage(messaging, (payload) => {
  const { notification } = payload;
  if (!notification) {
    log('Message missing payload');
    return;
  }

  showToast({
    message: `${notification.title} ${notification.body}`,
    action: {
      title: '{$ notifications.toast.title $}',
      callback: () => {
        setLocation((notification as TempAny).click_action);
      },
    },
  });
});

export const requestPermission = () => async (dispatch: Dispatch) => {
  try {
    Notification.requestPermission();
    getToken(true);
  } catch (error) {
    dispatch({
      type: UPDATE_NOTIFICATIONS_STATUS,
      status: NOTIFICATIONS_STATUS.DENIED,
    });
  }
};

export const getToken = (subscribe = false) => (
  dispatch: Dispatch,
  getState: typeof store.getState
) => {
  if (!subscribe && Notification.permission !== 'granted') {
    return;
  }

  fbGetToken(messaging)
    .then((currentToken) => {
      if (currentToken) {
        const state = getState();

        const subscribersRef = doc(db, 'notificationsSubscribers', currentToken);
        const subscribersPromise = getDoc(subscribersRef);

        const userUid = state.user && ((state.user as TempAny).uid || null);

        let userSubscriptionsPromise: Promise<DocumentSnapshot | null> = Promise.resolve(null);
        let userSubscriptionsRef: DocumentReference;
        if (userUid) {
          userSubscriptionsRef = doc(db, 'notificationsUsers', userUid);
          userSubscriptionsPromise = getDoc(userSubscriptionsRef);
        }

        Promise.all([subscribersPromise, userSubscriptionsPromise]).then(
          ([subscribersSnapshot, userSubscriptionsSnapshot]) => {
            const isDeviceSubscribed = subscribersSnapshot.exists()
              ? subscribersSnapshot.data()
              : false;
            const userSubscriptions =
              userSubscriptionsSnapshot && userSubscriptionsSnapshot.exists
                ? userSubscriptionsSnapshot.data()
                : {};

            const isUserSubscribed = !!(
              userSubscriptions?.tokens && userSubscriptions.tokens[currentToken]
            );

            if (isDeviceSubscribed) {
              dispatch({
                type: UPDATE_NOTIFICATIONS_STATUS,
                status: NOTIFICATIONS_STATUS.GRANTED,
                token: currentToken,
              });
              if (userUid && !isUserSubscribed) {
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
              if (userUid) {
                setDoc(
                  userSubscriptionsRef,
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
    .catch(() => {
      dispatch({
        type: UPDATE_NOTIFICATIONS_STATUS,
        status: NOTIFICATIONS_STATUS.DENIED,
        token: null,
      });
    });
};

export const unsubscribe = () => async (dispatch: Dispatch) => {
  await deleteToken(messaging);
  dispatch({
    type: UPDATE_NOTIFICATIONS_STATUS,
    status: NOTIFICATIONS_STATUS.DEFAULT,
    token: null,
  });
};
