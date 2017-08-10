const uiActions = {
  toggleDrawer: (value = null) => {
    store.dispatch({
      type: TOGGLE_DRAWER,
      value
    });
  },
  setViewportSize: value => {
    store.dispatch({
      type: SET_VIEWPORT_SIZE,
      value
    });
  },
  setHero: (hero, route) => {
    store.dispatch({
      type: SET_HERO,
      hero: hero || (heroSettings ? heroSettings[route || 'home'] : null)
    });
  },
  toggleVideoDialog: (value = null) => {
    store.dispatch({
      type: TOGGLE_VIDEO_DIALOG,
      value
    });
  }
};

const routeActions = {
  setRoute: (routeFromAction) => {
    const route = routeFromAction || 'home';
    store.dispatch({
      type: SET_ROUTE,
      route
    });
  },
  setSubRoute: subRoute => {
    store.dispatch({
      type: SET_SUB_ROUTE,
      subRoute
    });
  }
};

const dialogsActions = {
  openDialog: (dialogName, data) => {
    store.dispatch({
      type: OPEN_DIALOG,
      dialog: {
        [dialogName]: {
          isOpened: true,
          data
        }
      }
    });
  },
  closeDialog: (dialogName) => {
    store.dispatch({
      type: CLOSE_DIALOG,
      dialogName
    });
  }
};

const ticketsActions = {
  fetchTickets: () => {
    return firebase.database()
      .ref('/tickets')
      .on('value', snapshot => store.dispatch({
        type: FETCH_TICKETS,
        tickets: snapshot.val()
      }));
  }
};

const partnersActions = {
  fetchPartners: () => {
    return firebase.database()
      .ref('/partners')
      .on('value', snapshot => store.dispatch({
        type: FETCH_PARTNERS,
        partners: snapshot.val()
      }));
  }
};

const videosActions = {
  fetchVideos: () => {
    return firebase.database()
      .ref('/videos')
      .on('value', snapshot => store.dispatch({
        type: FETCH_VIDEOS,
        videos: snapshot.val()
      }));
  }
};

const blogActions = {
  fetchList: () => {
    return firebase.database()
      .ref('/blog/list')
      .on('value', snapshot => store.dispatch({
        type: FETCH_BLOG_LIST,
        list: snapshot.val()
      }));
  }
};

const speakersActions = {
  fetchList: () => {
    const state = store.getState();
    const sessionsPromise = Object.keys(state.sessions).length
      ? Promise.resolve(state.sessions)
      : sessionsActions.fetchList();

    const speakersPromise = new Promise(resolve => {
      firebase.database()
        .ref('/speakers')
        .on('value', snapshot => {
          resolve(snapshot.val());
        })
    });

    return new Promise(resolve => {
      Promise.all([sessionsPromise, speakersPromise])
        .then(([sessions, speakers]) => {
          let updatedSpeakers = {};

          for (let key of Object.keys(sessions)) {
            if (sessions[key].speakers) {
              sessions[key].speakers.map(id => {
                if (speakers[id])
                  updatedSpeakers = {
                    ...updatedSpeakers,
                    [id]: {
                      ...speakers[id],
                      sessions: speakers[id].sessions ? [...speakers[id].sessions, sessions[key]] : [sessions[key]]
                    }
                  };
              });
            }
          }

          const list = {
            ...speakers,
            ...updatedSpeakers
          };

          store.dispatch({
            type: FETCH_SPEAKERS_LIST,
            list
          });

          resolve(list);
        });
    });
  }
};

const sessionsActions = {
  fetchList: () => {
    const result = new Promise(resolve => {
      firebase.database()
        .ref('/sessions')
        .on('value', snapshot => {
          resolve(snapshot.val());
        })
    });

    result
      .then(list => {
        store.dispatch({
          type: FETCH_SESSIONS_LIST,
          list
        });
      });

    return result;
  }
};

const scheduleActions = {
  fetchSchedule: () => {
    const state = store.getState();
    const speakersPromise = Object.keys(state.speakers).length
      ? Promise.resolve(state.speakers)
      : speakersActions.fetchList();
    const schedulePromise = new Promise(resolve => {
      firebase.database()
        .ref('/schedule')
        .on('value', snapshot => {
          resolve(snapshot.val());
        })
    });

    return Promise.all([speakersPromise, schedulePromise])
      .then(([speakers, schedule]) => {
        const scheduleWorker = new Worker('/scripts/schedule-webworker.js');

        scheduleWorker.postMessage({
          speakers,
          sessions: store.getState().sessions,
          schedule
        });

        scheduleWorker.addEventListener('message', ({ data }) => {
          store.dispatch({
            type: FETCH_SCHEDULE,
            data: data.schedule
          });
          store.dispatch({
            type: UPDATE_SESSIONS,
            list: data.sessions
          });
          scheduleWorker.terminate();
        }, false);

      });
  }
};

const galleryActions = {
  fetchGallery: () => {
    return firebase.database()
      .ref('/gallery')
      .on('value', snapshot => {
        store.dispatch({
          type: FETCH_GALLERY,
          gallery: snapshot.val()
        });
      });
  }
};

const teamActions = {
  fetchTeam: () => {
    return firebase.database()
      .ref('/team')
      .on('value', snapshot => {
        store.dispatch({
          type: FETCH_TEAM,
          team: snapshot.val()
        });
      });
  }
};
