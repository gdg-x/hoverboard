import {
  ADD_POTENTIAL_PARTNER_FAILURE,
  ADD_POTENTIAL_PARTNER_SUCCESS,
  ADD_POTENTIAL_PARTNER,
  CLOSE_DIALOG,
  DELETE_FEEDBACK_FAILURE,
  DELETE_FEEDBACK_SUCCESS,
  DELETE_FEEDBACK,
  FETCH_BLOG_LIST_FAILURE,
  FETCH_BLOG_LIST_SUCCESS,
  FETCH_BLOG_LIST,
  FETCH_GALLERY_FAILURE,
  FETCH_GALLERY_SUCCESS,
  FETCH_GALLERY,
  FETCH_PARTNERS_FAILURE,
  FETCH_PARTNERS_SUCCESS,
  FETCH_PARTNERS,
  FETCH_PREVIOUS_FEEDBACK_FAILURE,
  FETCH_PREVIOUS_FEEDBACK_SUCCESS,
  FETCH_PREVIOUS_FEEDBACK,
  FETCH_PREVIOUS_SPEAKERS_FAILURE,
  FETCH_PREVIOUS_SPEAKERS_SUCCESS,
  FETCH_PREVIOUS_SPEAKERS,
  FETCH_SCHEDULE_FAILURE,
  FETCH_SCHEDULE_SUCCESS,
  FETCH_SCHEDULE,
  FETCH_SESSIONS_FAILURE,
  FETCH_SESSIONS_SUCCESS,
  FETCH_SESSIONS,
  FETCH_SPEAKERS_FAILURE,
  FETCH_SPEAKERS_SUCCESS,
  FETCH_SPEAKERS,
  FETCH_TEAM_FAILURE,
  FETCH_TEAM_SUCCESS,
  FETCH_TEAM,
  FETCH_TICKETS_FAILURE,
  FETCH_TICKETS_SUCCESS,
  FETCH_TICKETS,
  FETCH_USER_FEATURED_SESSIONS_FAILURE,
  FETCH_USER_FEATURED_SESSIONS_SUCCESS,
  FETCH_USER_FEATURED_SESSIONS,
  FETCH_VIDEOS_FAILURE,
  FETCH_VIDEOS_SUCCESS,
  FETCH_VIDEOS,
  HIDE_TOAST,
  NOTIFICATIONS_STATUS,
  OPEN_DIALOG,
  SEND_FEEDBACK_FAILURE,
  SEND_FEEDBACK_SUCCESS,
  SEND_FEEDBACK,
  SET_DIALOG_DATA,
  SET_DIALOG_ERROR,
  SET_FILTERS,
  SET_HERO_SETTINGS,
  SET_ROUTE,
  SET_SUB_ROUTE,
  SET_USER_FEATURED_SESSIONS_FAILURE,
  SET_USER_FEATURED_SESSIONS_SUCCESS,
  SET_USER_FEATURED_SESSIONS,
  SET_VIEWPORT_SIZE,
  SHOW_TOAST,
  SIGN_IN,
  SUBSCRIBE,
  TOGGLE_VIDEO_DIALOG,
  UPDATE_NOTIFICATIONS_STATUS,
  WIPE_PREVIOUS_FEEDBACK,
} from './constants';
import { store } from './store';

// TODO: Remove type
declare global {
  interface Window {
    firebase: typeof import('firebase');
  }
}

export interface VideoDialog {
  title: string;
  youtubeId: string;
  disableControls: boolean;
  opened: boolean;
}

export const uiActions = {
  setViewportSize: (value) => {
    store.dispatch({
      type: SET_VIEWPORT_SIZE,
      value,
    });
  },
  toggleVideoDialog: (value: VideoDialog) => {
    store.dispatch({
      type: TOGGLE_VIDEO_DIALOG,
      value,
    });
  },
  setHeroSettings: (value: import('../models/hero').Hero) => {
    store.dispatch({
      type: SET_HERO_SETTINGS,
      value,
    });
  },
};

export const routingActions = {
  setRoute: (routeFromAction) => {
    const route = routeFromAction || 'home';
    store.dispatch({
      type: SET_ROUTE,
      route,
    });
  },
  setSubRoute: (subRoute) => {
    store.dispatch({
      type: SET_SUB_ROUTE,
      subRoute,
    });
  },
  setLocation: (url) => {
    window.history.pushState({}, '', url);
    Polymer.Base.fire('location-changed', {}, { node: window });
  },
};

export const dialogsActions = {
  openDialog: (dialogName, data?) => {
    store.dispatch({
      type: OPEN_DIALOG,
      dialog: {
        [dialogName]: {
          isOpened: true,
          data,
        },
      },
    });
  },
  closeDialog: (dialogName) => {
    store.dispatch({
      type: CLOSE_DIALOG,
      dialogName,
    });
  },
  setDialogError: (dialogName) => ({
    type: SET_DIALOG_ERROR,
    payload: { dialogName },
  }),
};

let toastHideTimeOut;
export const toastActions = {
  showToast: (toast) => {
    const duration = typeof toast.duration !== 'undefined' ? toast.duration : 5000;
    store.dispatch({
      type: SHOW_TOAST,
      toast: Object.assign({}, toast, {
        duration,
        visible: true,
      }),
    });

    if (duration === 0) return;
    clearTimeout(toastHideTimeOut);
    toastHideTimeOut = setTimeout(() => {
      toastActions.hideToast();
    }, duration);
  },

  hideToast: () => {
    clearTimeout(toastHideTimeOut);
    store.dispatch({
      type: HIDE_TOAST,
    });
  },
};

export const ticketsActions = {
  fetchTickets: () => (dispatch) => {
    dispatch({
      type: FETCH_TICKETS,
    });

    return window.firebase
      .firestore()
      .collection('tickets')
      .orderBy('order', 'asc')
      .get()
      .then((snaps) => {
        const list = snaps.docs.map((snap) => Object.assign({}, snap.data(), { id: snap.id }));

        dispatch({
          type: FETCH_TICKETS_SUCCESS,
          payload: { list },
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_TICKETS_FAILURE,
          payload: { error },
        });
      });
  },
};

const _getPartnerItems = (groupId) =>
  window.firebase
    .firestore()
    .collection('partners')
    .doc(groupId)
    .collection('items')
    .get()
    .then((snaps) => {
      return snaps.docs
        .map((snap) => Object.assign({}, snap.data(), { id: snap.id }))
        .sort((a, b) => a.order - b.order);
    });

export const partnersActions = {
  addPartner: (data) => (dispatch) => {
    dispatch({
      type: ADD_POTENTIAL_PARTNER,
      payload: data,
    });

    const id = data.email.replace(/[^\w\s]/gi, '');
    const partner = {
      email: data.email,
      fullName: data.firstFieldValue || '',
      companyName: data.secondFieldValue || '',
    };

    window.firebase
      .firestore()
      .collection('potentialPartners')
      .doc(id)
      .set(partner)
      .then(() => {
        dispatch({
          type: ADD_POTENTIAL_PARTNER_SUCCESS,
          payload: { partner },
        });
      })
      .catch((error) => {
        dispatch({
          type: ADD_POTENTIAL_PARTNER_FAILURE,
          payload: { error },
        });
      });
  },
  fetchPartners: () => (dispatch) => {
    dispatch({
      type: FETCH_PARTNERS,
    });

    window.firebase
      .firestore()
      .collection('partners')
      .get()
      .then((snaps) =>
        Promise.all(
          snaps.docs.map((snap) => Promise.all([snap.data(), snap.id, _getPartnerItems(snap.id)]))
        )
      )
      .then((groups) =>
        groups.map(([group, id, items]) => {
          return Object.assign({}, group, { id, items });
        })
      )
      .then((list) => {
        dispatch({
          type: FETCH_PARTNERS_SUCCESS,
          payload: {
            list,
          },
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_PARTNERS_FAILURE,
          payload: { error },
        });
      });
  },
};

export const feedbackActions = {
  addComment: (data) => (dispatch) => {
    dispatch({
      type: SEND_FEEDBACK,
      payload: data,
    });

    window.firebase
      .firestore()
      .collection(`${data.collection}/${data.dbItem}/feedback`)
      .doc(data.userId)
      .set({
        contentRating: data.contentRating,
        styleRating: data.styleRating,
        comment: data.comment,
      })
      .then(() => {
        dispatch({
          type: SEND_FEEDBACK_SUCCESS,
          payload: data,
        });
      })
      .catch((error) => {
        dispatch({
          type: SEND_FEEDBACK_FAILURE,
          payload: { error },
        });
      });
  },
  checkPreviousFeedback: (data) => (dispatch) => {
    dispatch({
      type: FETCH_PREVIOUS_FEEDBACK,
      payload: data,
    });

    window.firebase
      .firestore()
      .collection(`${data.collection}/${data.dbItem}/feedback`)
      .doc(data.userId)
      .get()
      .then((snapshot) => {
        dispatch({
          type: FETCH_PREVIOUS_FEEDBACK_SUCCESS,
          payload: {
            collection: data.collection,
            dbItem: data.dbItem,
            previousFeedback: snapshot.data(),
          },
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_PREVIOUS_FEEDBACK_FAILURE,
          payload: { error },
        });
      });
  },
  deleteFeedback: (data) => (dispatch) => {
    dispatch({
      type: DELETE_FEEDBACK,
      payload: data,
    });

    window.firebase
      .firestore()
      .collection(`${data.collection}/${data.dbItem}/feedback`)
      .doc(data.userId)
      .delete()
      .then(() => {
        dispatch({
          type: DELETE_FEEDBACK_SUCCESS,
          payload: {
            collection: data.collection,
            dbItem: data.dbItem,
          },
        });
      })
      .catch((error) => {
        dispatch({
          type: DELETE_FEEDBACK_FAILURE,
          payload: { error },
        });
      });
  },
};

export const videosActions = {
  fetchVideos: () => (dispatch) => {
    dispatch({
      type: FETCH_VIDEOS,
    });

    return window.firebase
      .firestore()
      .collection('videos')
      .orderBy('order', 'asc')
      .get()
      .then((snaps) => {
        const list = snaps.docs.map((snap) => Object.assign({}, snap.data(), { id: snap.id }));

        dispatch({
          type: FETCH_VIDEOS_SUCCESS,
          payload: { list },
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_VIDEOS_FAILURE,
          payload: { error },
        });
      });
  },
};

export const blogActions = {
  fetchList: () => (dispatch) => {
    dispatch({
      type: FETCH_BLOG_LIST,
    });

    window.firebase
      .firestore()
      .collection('blog')
      .orderBy('published', 'desc')
      .get()
      .then((snaps) => {
        const list = snaps.docs.map((snap) => Object.assign({}, snap.data(), { id: snap.id }));

        const obj = list.reduce((acc, curr) => Object.assign({}, acc, { [curr.id]: curr }), {});

        dispatch({
          type: FETCH_BLOG_LIST_SUCCESS,
          payload: {
            obj,
            list,
          },
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_BLOG_LIST_FAILURE,
          payload: { error },
        });
      });
  },
};

export const speakersActions = {
  fetchList: () => (dispatch) => {
    dispatch({
      type: FETCH_SPEAKERS,
    });

    const speakersPromise = new Promise((resolve, reject) => {
      window.firebase
        .firestore()
        .collection('generatedSpeakers')
        .orderBy('order', 'asc')
        .get()
        .then((snaps) => {
          resolve(snaps.docs.map((snap) => Object.assign({}, snap.data())));
        })
        .catch(reject);
    });

    return Promise.all([speakersPromise])
      .then(([speakers]: any[][]) => {
        // TODO: Remove any
        dispatch({
          type: FETCH_SPEAKERS_SUCCESS,
          payload: {
            obj: speakers.reduce((acc, curr) => Object.assign({}, acc, { [curr.id]: curr }), {}),
            list: speakers,
          },
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_SPEAKERS_FAILURE,
          payload: { error },
        });
      });
  },
};

export const previousSpeakersActions = {
  fetchList: () => (dispatch) => {
    dispatch({
      type: FETCH_PREVIOUS_SPEAKERS,
    });

    window.firebase
      .firestore()
      .collection('previousSpeakers')
      .orderBy('order', 'asc')
      .get()
      .then((snaps) => {
        const list = snaps.docs.map((snap) => Object.assign({}, snap.data(), { id: snap.id }));

        const obj = list.reduce((acc, curr) => Object.assign({}, acc, { [curr.id]: curr }), {});

        dispatch({
          type: FETCH_PREVIOUS_SPEAKERS_SUCCESS,
          payload: {
            obj,
            list,
          },
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_PREVIOUS_SPEAKERS_FAILURE,
          payload: { error },
        });
      });
  },
};

export const sessionsActions = {
  fetchList: () => (dispatch) => {
    dispatch({
      type: FETCH_SESSIONS,
    });

    return new Promise((resolve, reject) => {
      window.firebase
        .firestore()
        .collection('generatedSessions')
        .get()
        .then((snaps) => {
          const list = [];
          const obj = {};
          const objBySpeaker = {};
          const tagFilters = new Set();
          const complexityFilters = new Set();

          snaps.docs.forEach((doc) => {
            const session = Object.assign({}, doc.data());
            list.push(session);
            session.tags && session.tags.map((tag) => tagFilters.add(tag.trim()));
            session.complexity && complexityFilters.add(session.complexity.trim());
            obj[doc.id] = session;
          });

          const payload = {
            obj,
            list,
            objBySpeaker,
          };

          dispatch({
            type: FETCH_SESSIONS_SUCCESS,
            payload,
          });

          dispatch({
            type: SET_FILTERS,
            payload: {
              tags: [...tagFilters].sort(),
              complexity: [...complexityFilters],
            },
          });

          resolve(payload);
        })
        .catch((error) => {
          dispatch({
            type: FETCH_SESSIONS_FAILURE,
            payload: { error },
          });
          reject(error);
        });
    });
  },

  fetchUserFeaturedSessions: (userId) => (dispatch) => {
    dispatch({
      type: FETCH_USER_FEATURED_SESSIONS,
      payload: { userId },
    });

    window.firebase
      .firestore()
      .collection('featuredSessions')
      .doc(userId)
      .get()
      .then((doc) => {
        dispatch({
          type: FETCH_USER_FEATURED_SESSIONS_SUCCESS,
          payload: {
            featuredSessions: doc.exists ? doc.data() : {},
          },
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_USER_FEATURED_SESSIONS_FAILURE,
          payload: { error },
        });
      });
  },

  setUserFeaturedSessions: (userId, featuredSessions) => (dispatch) => {
    dispatch({
      type: SET_USER_FEATURED_SESSIONS,
      payload: { userId, featuredSessions },
    });

    window.firebase
      .firestore()
      .collection('featuredSessions')
      .doc(userId)
      .set(featuredSessions)
      .then(() => {
        dispatch({
          type: SET_USER_FEATURED_SESSIONS_SUCCESS,
          payload: { featuredSessions },
        });
      })
      .catch((error) => {
        dispatch({
          type: SET_USER_FEATURED_SESSIONS_FAILURE,
          payload: { error },
        });
      });
  },
};

export const scheduleActions = {
  fetchSchedule: () => (dispatch) => {
    dispatch({
      type: FETCH_SCHEDULE,
    });

    return window.firebase
      .firestore()
      .collection('generatedSchedule')
      .get()
      .then((snaps) => {
        const scheduleDays = snaps.docs.map((snap) => snap.data());
        dispatch({
          type: FETCH_SCHEDULE_SUCCESS,
          data: scheduleDays.sort((a, b) => a.date.localeCompare(b.date)),
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_SCHEDULE_FAILURE,
          payload: { error },
        });
      });
  },
};

export const galleryActions = {
  fetchGallery: () => (dispatch) => {
    dispatch({
      type: FETCH_GALLERY,
    });

    return window.firebase
      .firestore()
      .collection('gallery')
      .get()
      .then((snaps) => {
        const list = snaps.docs.map((snap) => Object.assign({}, snap.data(), { id: snap.id }));

        dispatch({
          type: FETCH_GALLERY_SUCCESS,
          payload: { list },
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_GALLERY_FAILURE,
          payload: { error },
        });
      });
  },
};

const _getTeamMembers = (teamId) =>
  window.firebase
    .firestore()
    .collection('team')
    .doc(teamId)
    .collection('members')
    .get()
    .then((snaps) => snaps.docs.map((snap) => Object.assign({}, snap.data(), { id: snap.id })));

export const teamActions = {
  fetchTeam: () => (dispatch) => {
    dispatch({
      type: FETCH_TEAM,
    });

    window.firebase
      .firestore()
      .collection('team')
      .get()
      .then((snaps) =>
        Promise.all(
          snaps.docs.map((snap) => Promise.all([snap.data(), snap.id, _getTeamMembers(snap.id)]))
        )
      )
      .then((teams) =>
        teams.map(([team, id, members]) => {
          return Object.assign({}, team, { id, members });
        })
      )
      .then((list) => {
        dispatch({
          type: FETCH_TEAM_SUCCESS,
          payload: {
            list,
          },
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_TEAM_FAILURE,
          payload: { error },
        });
      });
  },
};

export const userActions = {
  signIn: (providerName) => {
    const firebaseProvider = helperActions.getFederatedProvider(providerName);

    return window.firebase
      .auth()
      .signInWithPopup(firebaseProvider)
      .then((signInObject) => {
        helperActions.storeUser(signInObject.user);
        notificationsActions.getToken(true);
      })
      .catch((error) => {
        if (
          error.code === 'auth/account-exists-with-different-credential' ||
          error.code === 'auth/email-already-in-use'
        ) {
          window.firebase
            .auth()
            .fetchSignInMethodsForEmail(error.email)
            .then((providers) => {
              helperActions.storeUser({
                signedIn: false,
                initialProviderId: providers[0],
                email: error.email,
                pendingCredential: error.credential,
              });
            });
        }
        helperActions.trackError('userActions', 'signIn', error);
      });
  },

  mergeAccounts: (initialProviderId, pendingCredential) => {
    const firebaseProvider = helperActions.getFederatedProvider(initialProviderId);

    return window.firebase
      .auth()
      .signInWithPopup(firebaseProvider)
      .then((result) => {
        result.user.linkWithCredential(pendingCredential);
      })
      .catch((error) => {
        helperActions.trackError('userActions', 'mergeAccounts', error);
      });
  },

  updateUser: () => {
    window.firebase.auth().onAuthStateChanged((user) => {
      helperActions.storeUser(user);
    });
  },

  signOut: () => {
    return window.firebase
      .auth()
      .signOut()
      .then(() => {
        helperActions.storeUser();
        subscribeActions.resetSubscribed();
      });
  },
};

export const subscribeActions = {
  subscribe: (data) => (dispatch) => {
    const id = data.email.replace(/[^\w\s]/gi, '');

    window.firebase
      .firestore()
      .collection('subscribers')
      .doc(id)
      .set({
        email: data.email,
        firstName: data.firstFieldValue || '',
        lastName: data.secondFieldValue || '',
      })
      .then(() => {
        dispatch({
          type: SUBSCRIBE,
          subscribed: true,
        });
        toastActions.showToast({ message: '{$ subscribeBlock.toast $}' });
      })
      .catch((error) => {
        dispatch({
          type: SET_DIALOG_DATA,
          dialog: {
            ['subscribe']: {
              isOpened: true,
              data: Object.assign(data, { errorOccurred: true }),
            },
          },
        });

        dispatch({
          type: SUBSCRIBE,
          subscribed: false,
        });

        helperActions.trackError('subscribeActions', 'subscribe', error);
      });
  },
  resetSubscribed: () => {
    store.dispatch({
      type: SUBSCRIBE,
      subscribed: false,
    });
  },
};

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

          const subscribersRef = window.firebase
            .firestore()
            .collection('notificationsSubscribers')
            .doc(currentToken);
          const subscribersPromise = subscribersRef.get();

          const userUid = state.user && (state.user.uid || null);

          let userSubscriptionsPromise = Promise.resolve(null);
          let userSubscriptionsRef;
          if (userUid) {
            userSubscriptionsRef = window.firebase
              .firestore()
              .collection('notificationsUsers')
              .doc(userUid);
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

export const helperActions = {
  storeUser: (user?) => {
    // TODO: Remove any
    let userToStore: any = { signedIn: false };

    if (user) {
      const { uid, displayName, photoURL, refreshToken, actualProvider, pendingCredential } = user;

      const email = user.email || (user.providerData && user.providerData[0].email);
      const initialProviderId =
        (user.providerData && user.providerData[0].providerId) || user.initialProviderId;
      const signedIn = (user.uid && true) || user.signedIn;

      userToStore = {
        signedIn,
        uid,
        email,
        displayName,
        photoURL,
        refreshToken,
        initialProviderId,
        actualProvider,
        pendingCredential,
      };
    }

    store.dispatch({
      type: SIGN_IN,
      user: userToStore,
    });

    if (!userToStore.signedIn) store.dispatch({ type: WIPE_PREVIOUS_FEEDBACK });
  },

  getFederatedProvider: (provider) => {
    switch (provider) {
      case 'https://accounts.google.com':
      case 'google.com': {
        const provider = new window.firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        return provider;
      }
      case 'https://www.facebook.com':
      case 'facebook.com': {
        const provider = new window.firebase.auth.FacebookAuthProvider();
        provider.addScope('email');
        provider.addScope('public_profile');
        return provider;
      }
      case 'https://twitter.com':
      case 'twitter.com':
        return new window.firebase.auth.TwitterAuthProvider();
    }
  },

  getProviderCompanyName: (provider) => {
    switch (provider) {
      case 'https://accounts.google.com':
      case 'google.com': {
        return 'Google';
      }
      case 'https://www.facebook.com':
      case 'facebook.com': {
        return 'Facebook';
      }
      case 'https://twitter.com':
      case 'twitter.com':
        return 'Twitter';
    }
  },

  trackError: (action, method, message) => {
    console.log('trackError', action, method, message);
    if (window.ga) {
      ga('send', 'event', 'error', action + ':' + method, message);
    } else {
      console.warn('window.ga not defined');
    }
  },
};
