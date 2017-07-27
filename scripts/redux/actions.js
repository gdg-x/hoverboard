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
    return firebase.database()
      .ref('/speakers')
      .on('value', snapshot => {
        store.dispatch({
          type: FETCH_SPEAKERS_LIST,
          list: snapshot.val()
        });
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

const userActions = {
  signIn: () => {
    let provider = new firebase.auth.GoogleAuthProvider();
    return firebase.auth()
      .signInWithPopup(provider)
      .then((signInObject) => {

        if (navigator.credentials) {
          var cred = new FederatedCredential({
            id: signInObject.user.email,
            name: signInObject.user.displayName,
            iconURL: signInObject.user.photoURL,
            provider: 'https://accounts.google.com'
          });

          navigator.credentials.store(cred);
        }

        store.dispatch({
          type: SIGN_IN,
          user: Object.assign(signInObject.user, { signedIn: true })
        });
      });
  },

  autoSignIn: () => {
    let currentUser = firebase.auth().currentUser;
    if (currentUser) {
      store.dispatch({
        type: AUTO_SIGN_IN,
        user: Object.assign(currentUser, { signedIn: true })
      });
    }
    else {

      if (navigator.credentials) {
        return navigator.credentials.get({
          password: true,
          federated: {
            providers: ['https://accounts.google.com']
          },
          mediation: 'silent'
        }).then((cred) => {
          (() => {
            if (cred) {
              var provider = new firebase.auth.GoogleAuthProvider();
              provider.setCustomParameters({
                'login_hint': cred.id || ''
              });

              return firebase.auth().signInWithPopup(provider)
                .then((signInObject) => {

                  store.dispatch({
                    type: AUTO_SIGN_IN,
                    user: Object.assign(signInObject.user, { signedIn: true })
                  });
                });
            }
          })();
        });
      }
    }
  },

  signOut: () => {
    return firebase.auth()
      .signOut()
      .then(() => {
        store.dispatch({
          type: SIGN_IN,
          user: {
            signedIn: false
          }
        });

        if (navigator.credentials) {
          navigator.credentials.requireUserMediation();
        }
      });
  }
};
