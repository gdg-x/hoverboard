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
  setAddToHomeScreen: (value) => {
    store.dispatch({
      type: SET_ADD_TO_HOMESCREEN,
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

  fetchPartners: () => (dispatch) => {
    dispatch({
      type: FETCH_PARTNERS,
    });
    const partnerPromise = new Promise(function (resolve) {
      fetch('data/partners.json')
        .then(function (response) {
          return response.json();
        })
        .then(function (res) {
          let partnersRaw = res.partners;
          // console.log(partnersRaw);
          resolve(partnersRaw);
          dispatch({
            type: FETCH_PARTNERS_SUCCESS,
            payload: {
              partnersRaw,
            },
          });
        });
    });
  },
};

const npartnersActions = {
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
        // console.log(list)
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
const galleryActions = {
  fetchGallery: () => (dispatch) => {
    dispatch({
      type: FETCH_GALLERY,
    });
    return new Promise(function (resolve) {
      fetch('data/gallery.json')
        .then(function (response) {
          return response.json();
        })
        .then(function (resp) {
          const list = resp;
          dispatch({
            type: FETCH_GALLERY_SUCCESS,
            payload: { list },
          });
          resolve(obj);
        })
        .catch((error) => {
          dispatch({
            type: FETCH_GALLERY_FAILURE,
            payload: { error },
          });
        });
    });
  },
};
const blogActions = {
  fetchList: () => (dispatch) => {
    dispatch({
      type: FETCH_BLOG_LIST,
    });
    return new Promise(function (resolve) {
      fetch('data/posts/blog-list.json')
        .then(function (response) {
          return response.json();
        })
        .then(function (res) {
          let obj = Object.assign({}, res);
          Object.keys(res).forEach((k) => obj[k].id = k);
          dispatch({
            type: FETCH_BLOG_LIST_SUCCESS,
            payload: {
              obj,
              list: Object.values(obj),
            },
          });
          resolve(posts);
        })
        .catch((error) => {
          dispatch({
            type: FETCH_BLOG_LIST_FAILURE,
            payload: { error },
          });
        });
    });
  },
};

function getScheduleJSON() {
  const schedulePromise = new Promise(function (resolve) {
    fetch('data/schedule.json')
      .then(function (response) {
        return response.json();
      })
      .then(function (res) {
        let scheduleRaw = res.years;
        resolve(scheduleRaw);
      });
  });

  return schedulePromise;
}

const speakersActions = {

  fetchList: () => (dispatch) => {
    dispatch({
      type: FETCH_SPEAKERS,
    });

    const schedulePromise = getScheduleJSON();

    const speakersPromise = new Promise(function (resolve) {
      fetch('data/speakers.json')
        .then(function (response) {
          return response.json();
        })
        .then(function (res) {
          let speakersRaw = res.speakers;
          resolve(speakersRaw);
        });
    });


    const sessionPromise = new Promise(function (resolve) {
      fetch('data/sessions.json')
        .then(function (response) {
          return response.json();
        })
        .then(function (res) {
          let sessionsRaw = res.sessions;
          resolve(sessionsRaw);
        });
    });


    return Promise.all([schedulePromise, speakersPromise, sessionPromise])
      .then(([scheduleRaw, speakersRaw, sessionsRaw]) => {
        let arr = sessionsSpeakersScheduleMap(sessionsRaw, speakersRaw, scheduleRaw);
        let speakers = arr.speakers;

        dispatch({
          type: FETCH_SPEAKERS_SUCCESS,
          payload: {
            obj: speakers.reduce((acc, curr) =>
              Object.assign({}, acc, { [curr.id]: curr }), {}),
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

const previousSpeakersActions = {
  fetchList: () => (dispatch) => {
    dispatch({
      type: FETCH_PREVIOUS_SPEAKERS,
    });
    return new Promise(function (resolve) {
      fetch('data/speakers-past.json')
        .then(function (response) {
          return response.json();
        })
        .then(function (res) {
          let speakers = res.previousSpeakers;
          const obj = speakers.reduce((acc, curr) =>
            Object.assign({}, acc, { [curr.id]: curr }), {});
          dispatch({
            type: FETCH_PREVIOUS_SPEAKERS_SUCCESS,
            payload: {
              obj,
              list: speakers,
            },
          });
          resolve(speakers);
        })
        .catch((error) => {
          dispatch({
            type: FETCH_PREVIOUS_SPEAKERS_FAILURE,
            payload: { error },
          });
        });
    });
  },
};

const sessionsActions = {

  fetchList: () => (dispatch) => {
    dispatch({
      type: FETCH_SESSIONS,
    });

    const schedulePromise = getScheduleJSON();

    const speakersPromise = new Promise(function (resolve) {
      fetch('data/speakers.json')
        .then(function (response) {
          return response.json();
        })
        .then(function (res) {
          let speakersRaw = res.speakers;
          resolve(speakersRaw);
        });
    });


    const sessionPromise = new Promise(function (resolve) {
      fetch('data/sessions.json')
        .then(function (response) {
          return response.json();
        })
        .then(function (res) {
          let sessionsRaw = res.sessions;
          resolve(sessionsRaw);
        });
    });


    return Promise.all([schedulePromise, speakersPromise, sessionPromise])
      .then(([scheduleRaw, speakersRaw, sessionsRaw]) => {
        let arr = sessionsSpeakersScheduleMap(sessionsRaw, speakersRaw, scheduleRaw);
        let sessions = arr.sessions;
        const list = [];
        const obj = {};
        const objBySpeaker = {};
        const tagFilters = new Set();
        const complexityFilters = new Set();
        sessions.forEach((session) => {
          list.push(session);
          session.tags && session.tags.map((tag) => tagFilters.add(tag.trim()));
          session.complexity && complexityFilters.add(session.complexity.trim());
          obj[session.id] = session;
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
            tags: [...tagFilters],
            complexity: [...complexityFilters],
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

  fetchSchedule: () => (dispatch) => {
    dispatch({
      type: FETCH_SCHEDULE,
    });

    const schedulePromise = getScheduleJSON();

    const speakersPromise = new Promise(function (resolve) {
      fetch('data/speakers.json')
        .then(function (response) {
          return response.json();
        })
        .then(function (res) {
          let speakersRaw = res.speakers;
          resolve(speakersRaw);
        });
    });


    const sessionPromise = new Promise(function (resolve) {
      fetch('data/sessions.json')
        .then(function (response) {
          return response.json();
        })
        .then(function (res) {
          let sessionsRaw = res.sessions;
          resolve(sessionsRaw);
        });
    });


    return Promise.all([schedulePromise, speakersPromise, sessionPromise])
      .then(([scheduleRaw, speakersRaw, sessionsRaw]) => {
        let arr = sessionsSpeakersScheduleMap(sessionsRaw, speakersRaw, scheduleRaw);

        let schedule = arr.schedule;

        dispatch({
          type: FETCH_SCHEDULE_SUCCESS,
          // data: schedule.sort((a, b) => a.date.localeCompare(b.date)),
          data: schedule,
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

function mapSessions(sessions, speakers) {
  sessions.forEach((session) => {
    if (session.speakers) {
      session.speakers.forEach((sessionSpeaker, index) => {
        speakers.forEach((speaker) => {
          if (sessionSpeaker === speaker.id) {
            session.speakers[index] = speaker;
          }
        });
      });
    }
  });
  return sessions;
}

function mapSpeakers(speakers, sessions) {
  speakers.forEach((speaker) => {
    if (speaker.sessions) {
      speaker.sessions.forEach((speakerSession, index) => {
        sessions.forEach((session) => {
          if (speakerSession.id === session.id) {
            speaker.sessions[index] = session;
          }
        });
      });
    }
  });
  return speakers;
}

function sessionsSpeakersScheduleMap(sessionsRaw, speakersRaw, scheduleRaw) {
  let schedule = [];
  let scheduleTags = [];

  let sessions = mapSessions(sessionsRaw, speakersRaw);
  let speakers = mapSpeakers(speakersRaw, sessionsRaw);

  scheduleRaw.forEach((year) => {
    let yearObj = {};
    yearObj.year = year.year;
    yearObj.schedule = [];

    year.schedule.forEach((day) => {
      const tracksNumber = day.tracks.length;
      let dayTags = [];
      let timeslots = [];
      let extensions = {};
      let scheduleTags = [];
      let dayKey = day.date;
      const timeslotLen = day.timeslots.length;
      for (let timeslotsIndex = 0; timeslotsIndex < timeslotLen; timeslotsIndex++) {
        const timeslot = day.timeslots[timeslotsIndex];
        let innerSessions = [];

        const sessionsLen = timeslot.sessions.length;

        for (let sessionIndex = 0; sessionIndex < sessionsLen; sessionIndex++) {
          let subSessions = [];

          const subSessionsLen = timeslot.sessions[sessionIndex].items.length;
          for (let subSessionIndex = 0; subSessionIndex < subSessionsLen; subSessionIndex++) {
            const sessionId = timeslot.sessions[sessionIndex].items[subSessionIndex];

            const subsession = sessionsRaw.find((session) => session.id === sessionId);


            const mainTag = subsession.tags ? subsession.tags[0] : 'General';
            const endTimeRaw = timeslot.sessions[sessionIndex].extend
              // eslint-disable-next-line max-len
              ? day.timeslots[timeslotsIndex + timeslot.sessions[sessionIndex].extend - 1].endTime
              : timeslot.endTime;
            const endTime = subSessionsLen > 1
              ? getEndTime(
                dayKey,
                timeslot.startTime,
                endTimeRaw,
                subSessionsLen,
                subSessionIndex + 1
              )
              : endTimeRaw;
            const startTime = subSessionsLen > 1 && subSessionIndex > 0
              ? sessions[timeslot.sessions[sessionIndex].items[subSessionIndex - 1]].endTime
              : timeslot.startTime;

            if (subsession.tags) {
              dayTags = [...new Set([...dayTags, ...subsession.tags])];
            }
            scheduleTags = addTagTo(scheduleTags || [], mainTag);

            const finalSubSession = Object.assign({}, subsession, {
              mainTag,
              id: sessionId.toString(),
              day: dayKey,
              // eslint-disable-next-line max-len
              track: day.tracks[timeslot.sessions[sessionIndex].trackNum - 1] || timeslot.sessions[sessionIndex].track || day.tracks[sessionIndex],
              startTime,
              endTime,
              duration: getDuration(dayKey, startTime, endTime),
              dateReadable: day.dateReadable,
            });

            Object.assign(subsession, finalSubSession);


            subSessions.push(finalSubSession);
          }
          let startRow = timeslotsIndex + 1;
          let startColumn = sessionIndex + 1;
          let endRow = timeslotsIndex + (timeslot.sessions[sessionIndex].extend || 0) + 1;
          let endColumn = sessionsLen !== 1
            // eslint-disable-next-line max-len
            ? sessionIndex + 2 : Object.keys(extensions).length ? Object.keys(extensions)[0]
              : tracksNumber + 1;


          if (timeslot.sessions[sessionIndex].extend) {
            extensions[sessionIndex + 1] = timeslot.sessions[sessionIndex].extend;
          }

          if (timeslot.sessions[sessionIndex].rowSpan) {
            endColumn = startColumn + timeslot.sessions[sessionIndex].rowSpan;
          }

          if (timeslot.sessions[sessionIndex].startCol) {
            startColumn = timeslot.sessions[sessionIndex].startCol;
            endColumn = sessionIndex + timeslot.sessions[sessionIndex].startCol;
          }

          innerSessions = [...innerSessions, {
            gridArea: `${startRow} / ${startColumn} / ${endRow} / ${endColumn}`,
            items: subSessions,
          }];
        }

        for (const [key, value] of Object.entries(extensions)) {
          if (value === 1) {
            delete extensions[key];
          } else {
            extensions[key] = value - 1;
          }
        }

        timeslots.push(Object.assign({}, timeslot, {
          sessions: innerSessions,
        }));
      }
      day.timeslots = timeslots;
      day.tags = dayTags;
      yearObj.schedule.push(day);
    });
    schedule.push(yearObj);
  });

  return {
    sessions,
    schedule,
    speakers,
  };
}

function getTimeDifference(date, startTime, endTime) {
  const timezone = new Date().toString().match(/([A-Z]+[+-][0-9]+.*)/)[1];
  const timeStart = new Date(date + ' ' + startTime + ' ' + timezone).getTime();
  const timeEnd = new Date(date + ' ' + endTime + ' ' + timezone).getTime();
  return timeEnd - timeStart;
}

function getEndTime(date, startTime, endTime, totalNumber, number) {
  const timezone = new Date().toString().match(/([A-Z]+[+-][0-9]+.*)/)[1];
  const timeStart = new Date(`${date} ${startTime} ${timezone}`).getTime();
  const difference = Math.floor(getTimeDifference(date, startTime, endTime) / totalNumber);
  const result = new Date(timeStart + difference * number);
  return result.getHours() + ':' + result.getMinutes();
}

function getDuration(date, startTime, endTime) {
  let difference = getTimeDifference(date, startTime, endTime);
  const hh = Math.floor(difference / 1000 / 60 / 60);
  difference -= hh * 1000 * 60 * 60;
  return {
    hh,
    mm: Math.floor(difference / 1000 / 60),
  };
}

function addTagTo(array, element) {
  if (array.indexOf(element) < 0) {
    return [...array, element];
  }
}


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
      .then((teams) => teams.map(([team, id, members]) => {
        return Object.assign({}, team, { id, members });
      }))
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
  subscribe: (data) => (dispatch) => {
    const id = data.email.replace(/[^\w\s]/gi, '');

    firebase.firestore().collection('subscribers')
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

