/* eslint-disable no-unused-vars,no-undef */
const uiActions = {
  toggleDrawer: (value = null) => {
    store.dispatch({
      type: TOGGLE_DRAWER,
      value,
    });
  },
  setViewportSize: (value) => {
    store.dispatch({
      type: SET_VIEWPORT_SIZE,
      value,
    });
  },
  toggleVideoDialog: (value = null) => {
    store.dispatch({
      type: TOGGLE_VIDEO_DIALOG,
      value,
    });
  },
  setHeroSettings: (value) => {
    store.dispatch({
      type: SET_HERO_SETTINGS,
      value,
    });
  },
};

const routingActions = {
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

const dialogsActions = {
  openDialog: (dialogName, data) => {
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
};

let toastHideTimeOut;
const toastActions = {
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

const ticketsActions = {
  fetchTickets: () => (dispatch) => {
    dispatch({
      type: FETCH_TICKETS,
    });

    return firebase.firestore().collection('tickets')
      .orderBy('order', 'asc')
      .get()
      .then((snaps) => {
        const list = snaps.docs
          .map((snap) => Object.assign({}, snap.data(), { id: snap.id }));

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

const partnersActions = {
  fetchPartners: () => {
    return firebase.database()
      .ref('/partners')
      .on('value', (snapshot) => store.dispatch({
        type: FETCH_PARTNERS,
        partners: snapshot.val(),
      }));
  },
};

const videosActions = {
  fetchVideos: () => (dispatch) => {
    dispatch({
      type: FETCH_VIDEOS,
    });

    return firebase.firestore().collection('videos')
      .orderBy('order', 'asc')
      .get()
      .then((snaps) => {
        const list = snaps.docs
          .map((snap) => Object.assign({}, snap.data(), { id: snap.id }));

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

const blogActions = {
  fetchList: () => (dispatch) => {
    dispatch({
      type: FETCH_BLOG_LIST,
    });

    firebase.firestore()
      .collection('blog')
      .orderBy('published', 'desc')
      .get()
      .then((snaps) => {
        const list = snaps.docs
          .map((snap) => Object.assign({}, snap.data(), { id: snap.id }));

        const obj = list.reduce(
          (acc, curr) => Object.assign({}, acc, { [curr.id]: curr }),
          {}
        );

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

const speakersActions = {
  fetchList: () => (dispatch) => {
    dispatch({
      type: FETCH_SPEAKERS,
    });

    firebase.firestore()
      .collection('speakers')
      .orderBy('order', 'asc')
      .get()
      .then((snaps) => {
        const list = snaps.docs
          .map((snap) => Object.assign({}, snap.data(), { id: snap.id }));

        const obj = list.reduce(
          (acc, curr) => Object.assign({}, acc, { [curr.id]: curr }),
          {}
        );

        dispatch({
          type: FETCH_SPEAKERS_SUCCESS,
          payload: {
            obj,
            list,
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

const previousSpeakersActions = {
  fetchList: () => {
    return firebase.database()
      .ref('/previousSpeakers')
      .on('value', (snapshot) => store.dispatch({
        type: FETCH_PREVIOUS_SPEAKERS_LIST,
        list: snapshot.val(),
      }));
  },
};

const sessionsActions = {
  fetchList: () => (dispatch) => {
    dispatch({
      type: FETCH_SESSIONS,
    });

    firebase.firestore()
      .collection('sessions')
      .get()
      .then((snaps) => {
        const list = [];
        const obj = {};
        const objBySpeaker = {};

        snaps.docs.forEach((doc) => {
          const data = doc.data();
          const session = Object.assign({}, data, { id: doc.id });
          list.push(session);
          obj[doc.id] = session;

          if (Array.isArray(data.speakers)) {
            data.speakers.forEach((speakerId) => {
              if (Array.isArray(objBySpeaker[speakerId])) {
                objBySpeaker[speakerId].push(session);
              } else {
                objBySpeaker[speakerId] = [session];
              }
            });
          }
        });

        dispatch({
          type: FETCH_SESSIONS_SUCCESS,
          payload: {
            obj,
            list,
            objBySpeaker,
          },
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_SESSIONS_FAILURE,
          payload: { error },
        });
      });
  },

  fetchUserFeaturedSessions: (userId) => {
    const result = new Promise((resolve) => {
      firebase.database()
        .ref(`/featuredSessions/${userId}`)
        .on('value', (snapshot) => {
          resolve(snapshot.val());
        });
    });

    result
      .then((featuredSessions) => {
        store.dispatch({
          type: FETCH_USER_FEATURED_SESSIONS,
          featuredSessions,
        });
      });

    return result;
  },

  setUserFeaturedSessions: (userId, featuredSessions) => {
    const result = firebase.database()
      .ref(`/featuredSessions/${userId}`)
      .set(featuredSessions);

    result
      .then(() => {
        store.dispatch({
          type: SET_USER_FEATURED_SESSIONS,
          featuredSessions,
        });
      });

    return result;
  },
};

const scheduleActions = {
  fetchSchedule: () => (dispatch, getState) => {
    dispatch({
      type: FETCH_SCHEDULE,
    });

    const state = getState();
    const speakersPromise = Object.keys(state.speakers.obj).length
      ? Promise.resolve(state.speakers.obj)
      : speakersActions.fetchList()(dispatch, getState);

    const schedulePromise = new Promise((resolve) => {
      firebase.database()
        .ref('/schedule')
        .on('value', (snapshot) => {
          resolve(snapshot.val());
        });
    });

    return Promise.all([speakersPromise, schedulePromise])
      .then(([speakers, schedule]) => {
        const scheduleWorker = new Worker('/scripts/schedule-webworker.js');

        scheduleWorker.postMessage({
          speakers,
          sessions: getState().sessions.list.obj,
          schedule,
        });

        scheduleWorker.addEventListener('message', ({ data }) => {
          dispatch({
            type: FETCH_SCHEDULE_SUCCESS,
            data: data.schedule,
          });
          // store.dispatch({
          //   type: UPDATE_SESSIONS,
          //   list: data.sessions,
          // });
          // store.dispatch({
          //   type: UPDATE_SPEAKERS,
          //   list: data.speakers,
          // });
          scheduleWorker.terminate();
        }, false);
      });
  },
};

const galleryActions = {
  fetchGallery: () => (dispatch) => {
    dispatch({
      type: FETCH_GALLERY,
    });

    return firebase.firestore().collection('gallery')
      .get()
      .then((snaps) => {
        const list = snaps.docs
          .map((snap) => Object.assign({}, snap.data(), { id: snap.id }));

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

const _getTeamMembers = (teamId) => firebase.firestore()
  .collection('team').doc(teamId).collection('members')
  .get()
  .then((snaps) => snaps.docs
    .map((snap) => Object.assign({}, snap.data(), { id: snap.id }))
  );

const teamActions = {
  fetchTeam: () => (dispatch) => {
    dispatch({
      type: FETCH_TEAM,
    });

    firebase.firestore()
      .collection('team')
      .get()
      .then((snaps) => Promise.all(
        snaps.docs.map((snap) => Promise.all([
          snap.data(),
          snap.id,
          _getTeamMembers(snap.id),
        ]))
      ))
      .then((teams) => teams.map(([team, id, members]) => Object.assign({}, team, { id, members })))
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

const userActions = {
  signIn: (providerName) => {
    const firebaseProvider = helperActions.getFederatedProvider(providerName);

    return firebase.auth()
      .signInWithPopup(firebaseProvider)
      .then((signInObject) => {
        helperActions.storeUser(signInObject.user);
        notificationsActions.getToken(true);
      })
      .catch((error) => {
        if (error.code === 'auth/account-exists-with-different-credential' ||
          error.code === 'auth/email-already-in-use') {
          firebase.auth().fetchProvidersForEmail(error.email)
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

    return firebase.auth()
    .signInWithPopup(firebaseProvider)
    .then((result) => {
      result.user.linkWithCredential(pendingCredential);
    })
    .catch((error) => {
      helperActions.trackError('userActions', 'mergeAccounts', error);
    });
  },

  updateUser: () => {
    firebase.auth().onAuthStateChanged((user) => {
      helperActions.storeUser(user);
    });
  },

  signOut: () => {
    return firebase.auth()
      .signOut()
      .then(() => {
        helperActions.storeUser();
        subscribeActions.resetSubscribed();
      });
  },
};

const subscribeActions = {
  addPartner: (data) => {
    const id = data.email.replace(/[^\w\s]/gi, '');

    firebase.database().ref(`potentialPartners/${id}`).set({
      email: data.email,
      fullName: data.firstFieldValue || '',
      companyName: data.secondFieldValue || '',
    }).then(() => {
      dialogsActions.closeDialog(DIALOGS.SUBSCRIBE);
      toastActions.showToast({ message: '{$ partnersBlock.toast $}' });
    });
  },
  subscribe: (data) => {
    const id = data.email.replace(/[^\w\s]/gi, '');

    firebase.database().ref(`subscribers/${id}`).set({
      email: data.email,
      firstName: data.firstFieldValue || '',
      lastName: data.secondFieldValue || '',
    })
      .then(() => {
        store.dispatch({
          type: SUBSCRIBE,
          subscribed: true,
        });
        toastActions.showToast({ message: '{$ subscribeBlock.toast $}' });
      })
      .catch((error) => {
        store.dispatch({
          type: SET_DIALOG_DATA,
          dialog: {
            ['subscribe']: {
              isOpened: true,
              data: Object.assign(data, { errorOccurred: true }),
            },
          },
        });

        store.dispatch({
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
const notificationsActions = {
  initializeMessaging: () => {
    return new Promise((resolve) => {
      messaging = firebase.messaging();
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
        notificationsActions.getToken(true);
      });
      resolve(messaging);
    });
  },
  requestPermission: () => (dispatch) => {
    return messaging.requestPermission()
      .then(() => {
        notificationsActions.getToken(true);
      })
      .catch(() => {
        dispatch({
          type: UPDATE_NOTIFICATIONS_STATUS,
          status: NOTIFICATIONS_STATUS.DENIED,
        });

        helperActions.trackError('notificationActions', 'requestPermission', error);
      });
  },

  getToken: (subscribe) => (dispatch, getState) => {
    return messaging.getToken()
      .then((currentToken) => {
        if (currentToken) {
          const state = getState();
          const subscribersRef = firebase.database()
            .ref(`/notifications/subscribers/${currentToken}`);
          const subscribersPromise = subscribersRef.once('value');
          const userUid = state.user && (state.user.uid || null);

          let userSubscriptionsPromise = Promise.resolve(null);
          let userSubscriptionsRef;
          if (userUid) {
            userSubscriptionsRef = firebase.database()
              .ref(`/notifications/users/${userUid}/${currentToken}`);
            userSubscriptionsPromise = userSubscriptionsRef.once('value');
          }

          Promise.all([subscribersPromise, userSubscriptionsPromise])
            .then(([subscribersSnapshot, userSubscriptionsSnapshot]) => {
              const isDeviceSubscribed = subscribersSnapshot.val();
              const isUserSubscribed = userSubscriptionsSnapshot
                ? userSubscriptionsSnapshot.val() :
                false;

              if (isDeviceSubscribed) {
                dispatch({
                  type: UPDATE_NOTIFICATIONS_STATUS,
                  status: NOTIFICATIONS_STATUS.GRANTED,
                  token: currentToken,
                });
                if (userUid && !isUserSubscribed) {
                  userSubscriptionsRef.set(userUid);
                }
              } else if (!isDeviceSubscribed && subscribe) {
                subscribersRef.set(true);
                userUid && userSubscriptionsRef.set(true);
                dispatch({
                  type: UPDATE_NOTIFICATIONS_STATUS,
                  status: NOTIFICATIONS_STATUS.GRANTED,
                  token: currentToken,
                });
              }
            });
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

        helperActions.trackError('notificationActions', 'getToken', error);
      });
  },

  unsubscribe: (token) => (dispatch) => {
    return messaging.deleteToken(token)
      .then(() => {
        dispatch({
          type: UPDATE_NOTIFICATIONS_STATUS,
          status: NOTIFICATIONS_STATUS.DEFAULT,
          token: null,
        });
      });
  },
};

const helperActions = {
  storeUser: (user) => {
    let userToStore = { signedIn: false };

    if (user) {
      const {
        uid,
        displayName,
        photoURL,
        refreshToken,
        actualProvider,
        pendingCredential,
      } = user;

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
  },

  getFederatedProvider: (provider) => {
    switch (provider) {
      case 'https://accounts.google.com':
      case 'google.com': {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        return provider;
      }
      case 'https://www.facebook.com':
      case 'facebook.com': {
        const provider = new firebase.auth.FacebookAuthProvider();
        provider.addScope('email');
        provider.addScope('public_profile');
        return provider;
      }
      case 'https://twitter.com':
      case 'twitter.com':
        return new firebase.auth.TwitterAuthProvider();
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
    if (window.ga) {
      ga('send', 'event', 'error', action + ':' + method, message);
    }
  },
};

