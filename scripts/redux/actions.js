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
  setDialogError: (dialogName) => ({
    type: SET_DIALOG_ERROR,
    payload: { dialogName },
  }),
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

const _getPartnerItems = (groupId) => firebase.firestore()
  .collection('partners').doc(groupId).collection('items').orderBy('order', 'asc')
  .get()
  .then((snaps) => snaps.docs
    .map((snap) => Object.assign({}, snap.data(), { id: snap.id }))
  );

const partnersActions = {
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

    firebase.firestore().collection('potentialPartners')
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

    firebase.firestore()
      .collection('partners')
      .orderBy('order', 'asc')
      .get()
      .then((snaps) => Promise.all(
        snaps.docs.map((snap) => Promise.all([
          snap.data(),
          snap.id,
          _getPartnerItems(snap.id),
        ]))
      ))
      .then((groups) => groups.map(([group, id, items]) => Object.assign({}, group, { id, items })))
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

const pressActions = {
  fetchList: () => (dispatch) => {
    dispatch({
      type: FETCH_PRESS_LIST,
    });

    firebase.firestore()
      .collection('press')
      .orderBy('published', 'asc')
      .get()
      .then((snaps) => {
        const list = snaps.docs
          .map((snap) => Object.assign({}, snap.data(), { id: snap.id }));

        const obj = list.reduce(
          (acc, curr) => Object.assign({}, acc, { [curr.id]: curr }),
          {}
        );

        dispatch({
          type: FETCH_PRESS_LIST_SUCCESS,
          payload: {
            obj,
            list,
          },
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_PRESS_LIST_FAILURE,
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
  fetchList: () => (dispatch) => {
    dispatch({
      type: FETCH_PREVIOUS_SPEAKERS,
    });

    firebase.firestore()
      .collection('previousSpeakers')
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

const fundraiserActions = {
  fetchList: () => (dispatch) => {
    dispatch({
      type: FETCH_PROJECTS,
    });

    firebase.firestore()
      .collection('projects')
      .get()
      .then((snaps) => {
        const list = snaps.docs
          .map((snap) => Object.assign({}, snap.data(), { id: snap.id }));

        const obj = list.reduce(
          (acc, curr) => Object.assign({}, acc, { [curr.id]: curr }),
          {}
        );

        dispatch({
          type: FETCH_PROJECTS_SUCCESS,
          payload: {
            obj,
            list,
          },
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_PROJECTS_FAILURE,
          payload: { error },
        });
      });
  },
  create: (data) => (dispatch) => {
    dialogsActions.closeDialog(DIALOGS.NEW_PROJECT);
    toastActions.showToast({ message: 'Project submitted!' });
    dispatch({
      type: CREATE_PROJECT,
    });
    firebase.firestore().collection('projects')
      .add({
        name: data.firstFieldValue,
        description: data.secondFieldValue || '',
        budget: data.budget,
        contributions: {},
      })
      .catch((error) => {
        alert(error);
        dispatch({
          type: SET_DIALOG_DATA,
          dialog: {
            ['submit-project']: {
              isOpened: true,
              data: Object.assign(data, { errorOccurred: true }),
            },
          },
        });

        helperActions.trackError('projectActions', 'submit', error);
      });
  },
  pledge: (id, project, toastText) => (dispatch) => {
    toastActions.showToast({ message: toastText ?
      toastText : 'Pledge submitted! You can adjust or set to zero until the fundraiser ends!' });
    dispatch({
      type: ADD_PLEDGE,
    });
    firebase.firestore()
      .collection('projects')
      .doc(id)
      .set(project)
      .catch((error) => {
        dispatch({
          type: SET_DIALOG_DATA,
          dialog: {
            ['project-details']: {
              isOpened: true,
              data: Object.assign(data, { errorOccurred: true }),
            },
          },
        });

        helperActions.trackError('projectActions', 'pledge', error);
      });
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

  fetchUserFeaturedSessions: (userId) => (dispatch) => {
    dispatch({
      type: FETCH_USER_FEATURED_SESSIONS,
      payload: { userId },
    });

    firebase.firestore()
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

    firebase.firestore()
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

const scheduleActions = {
  fetchSchedule: () => (dispatch, getState) => {
    dispatch({
      type: FETCH_SCHEDULE,
    });

    const state = getState();
    const speakersPromise = Object.keys(state.speakers.obj).length
      ? Promise.resolve(state.speakers.obj)
      : speakersActions.fetchList()(dispatch, getState);

    const schedulePromise = new Promise((resolve, reject) => {
      firebase.firestore()
        .collection('schedule')
        .orderBy('date', 'desc')
        .get()
        .then((snaps) => {
          resolve(snaps.docs.map((s) => s.data()));
        })
        .catch(reject);
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
            data: Object.values(data.schedule.days).sort((a, b) => a.date.localeCompare(b.date)),
          });

          const sessionsObjBySpeaker = {};
          const sessionsList = Object.values(data.sessions);

          sessionsList.forEach((session) => {
            if (Array.isArray(session.speakers)) {
              session.speakers.forEach((speaker) => {
                if (Array.isArray(sessionsObjBySpeaker[speaker.id])) {
                  sessionsObjBySpeaker[speaker.id].push(session);
                } else {
                  sessionsObjBySpeaker[speaker.id] = [session];
                }
              });
            }
          });
          store.dispatch({
            type: UPDATE_SESSIONS,
            payload: {
              obj: data.sessions,
              list: sessionsList,
              objBySpeaker: sessionsObjBySpeaker,
            },
          });

          scheduleWorker.terminate();
        }, false);
      })
      .catch((error) => {
        dispatch({
          type: FETCH_SCHEDULE_FAILURE,
          payload: { error },
        });
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
  .collection('team').doc(teamId).collection('members').orderBy('order', 'asc')
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
      if (user) {
        userActions.isRegistered(user.email);
      }
    });
  },

  signInWithEmail: (email, url) => {
    var actionCodeSettings = {
      // URL you want to redirect back to. The domain (www.example.com) for this
      // URL must be whitelisted in the Firebase Console.
      url: url,
      // This must be true.
      handleCodeInApp: true,
    };

    firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings)
      .then(function () {
        // The link was successfully sent. Inform the user.
        // Save the email locally so you don't need to ask the user for it again
        // if they open the link on the same device.
        window.localStorage.setItem('emailForSignIn', email);
        dialogsActions.closeDialog(DIALOGS.SIGNIN);
        toastActions.showToast({ message: 'Success! Check your email for a sign in link!' });
      })
      .catch(function (error) {
        // Some error occurred, you can inspect the code: error.code
        helperActions.trackError('userActions', 'signInWithEmail', error);
        alert(error);
      });
  },

  checkEmailSignin: ()=> {
    // Confirm the link is a sign-in with email link.
    if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
      // Additional state parameters can also be passed via URL.
      // This can be used to continue the user's intended action before triggering
      // the sign-in operation.
      // Get the email if available. This should be available if the user completes
      // the flow on the same device where they started it.
      var email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        // User opened the link on a different device. To prevent session fixation
        // attacks, ask the user to provide the associated email again. For example:
        email = window.prompt('Please provide your email for confirmation');
      }

      // eslint-disable-next-line max-len, no-useless-escape
      const emailRegularExpression = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      const validEmail = emailRegularExpression.test(email);
      if (validEmail) {
      // The client SDK will parse the code from the link for you.
      firebase.auth().signInWithEmailLink(email, window.location.href)
        .then(function (result) {
          // Clear email from storage.
          window.localStorage.removeItem('emailForSignIn');

          // Clear out the query params.
          window.history.replaceState({}, document.title, window.location.href.split('?')[0]);

          // You can access the new user via result.user
          // Additional user info profile not available via:
          // result.additionalUserInfo.profile == null
          // You can check if the user is new or existing:
          // result.additionalUserInfo.isNewUser
        })
        .catch(function (error) {
          // Some error occurred, you can inspect the code: error.code
          // Common errors could be invalid email and invalid or expired OTPs.
          alert(error + 'You are probably already signed in so this is no problem!');
        });
      }
      // if (this.user && this.user.email) {
      //   this.dispatch(userActions.isRegistered(this.user.email));
      // }
    }
  },

  signOut: () => {
    return firebase.auth()
      .signOut()
      .then(() => {
        helperActions.storeUser();
        subscribeActions.resetSubscribed();
      });
  },

  isRegistered: (email) => (dispatch) => {
    dispatch({
      type: IS_REGISTERED,
    });

    firebase.firestore()
      .collection('attendees2019')
      .doc(email.toLowerCase())
      .get()
      .then((doc) => {
        dispatch({
          type: IS_REGISTERED_SUCCESS,
          registered: doc.exists,
        });
      })
      .catch((error) => {
        dispatch({
          type: IS_REGISTERED_FAILURE,
          payload: { error },
        });
      });
    },
};

const subscribeActions = {
  subscribe: (data) => (dispatch) => {
    const id = data.email.replace(/[^\w\s]/gi, '');

    firebase.firestore().collection('subscribers')
      .doc(id)
      .set({
        email: data.email,
        firstName: data.firstFieldValue || '',
        lastName: data.secondFieldValue || '',
        countryCode: data.thirdFieldValue || '',
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
        store.dispatch(notificationsActions.getToken(true));
      });
      resolve(messaging);
    });
  },
  requestPermission: () => (dispatch) => {
    return messaging.requestPermission()
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

  getToken: (subscribe) => (dispatch, getState) => {
    return messaging.getToken()
      .then((currentToken) => {
        if (currentToken) {
          const state = getState();

          const subscribersRef = firebase.firestore()
            .collection('notificationsSubscribers')
            .doc(currentToken);
          const subscribersPromise = subscribersRef.get();

          const userUid = state.user && (state.user.uid || null);

          let userSubscriptionsPromise = Promise.resolve(null);
          let userSubscriptionsRef;
          if (userUid) {
            userSubscriptionsRef = firebase.firestore()
              .collection('notificationsUsers')
              .doc(userUid);
            userSubscriptionsPromise = userSubscriptionsRef.get();
          }

          Promise.all([subscribersPromise, userSubscriptionsPromise])
            .then(([subscribersSnapshot, userSubscriptionsSnapshot]) => {
              const isDeviceSubscribed = subscribersSnapshot.exists
                ? subscribersSnapshot.data()
                : false;
              const userSubscriptions =
                (userSubscriptionsSnapshot && userSubscriptionsSnapshot.exists)
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
                  userSubscriptionsRef.set({
                    tokens: { [currentToken]: true },
                  }, { merge: true });
                }
              } else if (!isDeviceSubscribed && subscribe) {
                subscribersRef.set({ value: true });
                if (userUid) {
                  userSubscriptionsRef.set({
                    tokens: { [currentToken]: true },
                  }, { merge: true });
                }
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

      userActions.isRegistered(email);
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

