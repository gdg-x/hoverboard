/* eslint-disable no-unused-vars,no-undef */
const uiReducer = (state = initialState.ui, action) => {
  switch (action.type) {
    case TOGGLE_DRAWER:
      return Object.assign({}, state, {
        isDrawerOpened: action.value || !state.isDrawerOpened,
      });
    case TOGGLE_VIDEO_DIALOG:
      return Object.assign({}, state, {
        videoDialog: Object.assign({}, state.videoDialog, action.value),
      });
    case SET_VIEWPORT_SIZE:
      return Object.assign({}, state, {
        viewport: Object.assign({}, state.viewport, action.value),
      });
    case SET_HERO_SETTINGS:
      return Object.assign({}, state, {
        heroSettings: Object.assign({}, state.heroSettings, action.value),
      });
    default:
      return state;
  }
};

const routingReducer = (state = initialState.routing, action) => {
  switch (action.type) {
    case SET_ROUTE:
      return Object.assign({}, state, {
        route: action.route,
        subRoute: null,
      });
    case SET_SUB_ROUTE:
      return Object.assign({}, state, {
        subRoute: action.subRoute,
      });
    default:
      return state;
  }
};

const dialogsReducer = (state = initialState.dialogs, action) => {
  switch (action.type) {
    case OPEN_DIALOG:
    case SET_DIALOG_DATA:
      return Object.assign({}, state, action.dialog);

    case SET_DIALOG_ERROR: {
      const dialog = state[action.payload.dialogName];

      return Object.assign({}, state, {
        [action.payload.dialogName]: {
          isOpened: dialog.isOpened,
          data: Object.assign({}, dialog.data, { errorOccurred: true }),
        },
      });
    }

    case CLOSE_DIALOG:
      return Object.assign({}, state, {
        [action.dialogName]: initialState.dialogs[action.dialogName],
      });
    default:
      return state;
  }
};

const ticketsReducer = (state = initialState.tickets, action) => {
  switch (action.type) {
    case FETCH_TICKETS:
      return Object.assign({}, state, {
        fetching: true,
        fetchingError: null,
        list: [],
      });

    case FETCH_TICKETS_FAILURE:
      return Object.assign({}, state, {
        fetching: false,
        fetchingError: action.payload.error,
      });

    case FETCH_TICKETS_SUCCESS:
      return Object.assign({}, state, {
        fetching: false,
        list: action.payload.list,
      });

    default:
      return state;
  }
};

const partnersReducer = (state = initialState.partners, action) => {
  switch (action.type) {
    case FETCH_PARTNERS:
      return Object.assign({}, state, {
        fetching: true,
        fetchingError: null,
        list: [],
      });

    case FETCH_PARTNERS_FAILURE:
      return Object.assign({}, state, {
        fetching: false,
        fetchingError: action.payload.error,
      });

    case FETCH_PARTNERS_SUCCESS:
      return Object.assign({}, state, {
        fetching: false,
        list: action.payload.list,
      });

    case ADD_POTENTIAL_PARTNER:
      return Object.assign({}, state, {
        adding: true,
        addingError: null,
      });

    case ADD_POTENTIAL_PARTNER_FAILURE:
      return Object.assign({}, state, {
        adding: false,
        addingError: action.payload.error,
      });

    case ADD_POTENTIAL_PARTNER_SUCCESS:
      return Object.assign({}, state, {
        adding: false,
      });

    default:
      return state;
  }
};

const videosReducer = (state = initialState.videos, action) => {
  switch (action.type) {
    case FETCH_VIDEOS:
      return Object.assign({}, state, {
        fetching: true,
        fetchingError: null,
        list: [],
      });

    case FETCH_VIDEOS_FAILURE:
      return Object.assign({}, state, {
        fetching: false,
        fetchingError: action.payload.error,
      });

    case FETCH_VIDEOS_SUCCESS:
      return Object.assign({}, state, {
        fetching: false,
        list: action.payload.list,
      });

    default:
      return state;
  }
};

const blogReducer = (state = initialState.blog, action) => {
  switch (action.type) {
    case FETCH_BLOG_LIST:
      return Object.assign({}, state, {
        fetching: true,
        fetchingError: null,
        list: [],
        obj: {},
      });

    case FETCH_BLOG_LIST_FAILURE:
      return Object.assign({}, state, {
        fetching: false,
        fetchingError: action.payload.error,
      });

    case FETCH_BLOG_LIST_SUCCESS:
      return Object.assign({}, state, {
        fetching: false,
        list: action.payload.list,
        obj: action.payload.obj,
      });

    default:
      return state;
  }
};

const speakersReducer = (state = initialState.speakers, action) => {
  switch (action.type) {
    case FETCH_SPEAKERS:
      return Object.assign({}, state, {
        fetching: true,
        fetchingError: null,
        list: [],
        obj: {},
      });

    case FETCH_SPEAKERS_FAILURE:
      return Object.assign({}, state, {
        fetching: false,
        fetchingError: action.payload.error,
      });

    case FETCH_SPEAKERS_SUCCESS:
      return Object.assign({}, state, {
        fetching: false,
        list: action.payload.list,
        obj: action.payload.obj,
      });

    default:
      return state;
  }
};

const previousSpeakersReducer = (state = initialState.previousSpeakers, action) => {
  switch (action.type) {
    case FETCH_PREVIOUS_SPEAKERS:
      return Object.assign({}, state, {
        fetching: true,
        fetchingError: null,
        list: [],
        obj: {},
      });

    case FETCH_PREVIOUS_SPEAKERS_FAILURE:
      return Object.assign({}, state, {
        fetching: false,
        fetchingError: action.payload.error,
      });

    case FETCH_PREVIOUS_SPEAKERS_SUCCESS:
      return Object.assign({}, state, {
        fetching: false,
        list: action.payload.list,
        obj: action.payload.obj,
      });

    default:
      return state;
  }
};

const sessionsReducer = (state = initialState.sessions, action) => {
  switch (action.type) {
    case FETCH_SESSIONS:
      return Object.assign({}, state, {
        list: {
          fetching: true,
          fetchingError: null,
          list: [],
          obj: {},
          objBySpeaker: {},
        },
      });

    case FETCH_SESSIONS_FAILURE:
      return Object.assign({}, state, {
        list: {
          fetching: false,
          fetchingError: action.payload.error,
        },
      });

    case FETCH_SESSIONS_SUCCESS:
      return Object.assign({}, state, {
        list: {
          fetching: false,
          list: action.payload.list,
          obj: action.payload.obj,
          objBySpeaker: action.payload.objBySpeaker,
        },
      });

    case UPDATE_SESSIONS:
      return Object.assign({}, state, {
        list: {
          list: action.payload.list,
          obj: action.payload.obj,
          objBySpeaker: action.payload.objBySpeaker,
        },
      });

    case FETCH_USER_FEATURED_SESSIONS:
    case SET_USER_FEATURED_SESSIONS:
      return Object.assign({}, state, {
        featuredError: null,
        featuredFetching: true,
      });

    case FETCH_USER_FEATURED_SESSIONS_FAILURE:
    case SET_USER_FEATURED_SESSIONS_FAILURE:
      return Object.assign({}, state, {
        featuredError: action.payload.error,
        featuredFetching: false,
      });

    case FETCH_USER_FEATURED_SESSIONS_SUCCESS:
    case SET_USER_FEATURED_SESSIONS_SUCCESS:
      return Object.assign({}, state, {
        featured: action.payload.featuredSessions || {},
        featuredFetching: false,
      });

    default:
      return state;
  }
};

const scheduleReducer = (state = initialState.schedule, action) => {
  switch (action.type) {
    case FETCH_SCHEDULE_SUCCESS:
      return action.data;
    default:
      return state;
  }
};

const galleryReducer = (state = initialState.gallery, action) => {
  switch (action.type) {
    case FETCH_GALLERY:
      return Object.assign({}, state, {
        fetching: true,
        fetchingError: null,
        list: [],
      });

    case FETCH_GALLERY_FAILURE:
      return Object.assign({}, state, {
        fetching: false,
        fetchingError: action.payload.error,
      });

    case FETCH_GALLERY_SUCCESS:
      return Object.assign({}, state, {
        fetching: false,
        list: action.payload.list,
      });

    default:
      return state;
  }
};

const teamReducer = (state = initialState.team, action) => {
  switch (action.type) {
    case FETCH_TEAM:
      return Object.assign({}, state, {
        fetching: true,
        fetchingError: null,
        list: [],
      });

    case FETCH_TEAM_FAILURE:
      return Object.assign({}, state, {
        fetching: false,
        fetchingError: action.payload.error,
      });

    case FETCH_TEAM_SUCCESS:
      return Object.assign({}, state, {
        fetching: false,
        list: action.payload.list,
      });

    default:
      return state;
  }
};

const userReducer = (state = initialState.user, action) => {
  switch (action.type) {
    case SIGN_IN:
    case SIGN_OUT:
      return action.user;
    default:
      return state;
  }
};

const subscribeReducer = (state = initialState.subscribed, action) => {
  switch (action.type) {
    case SUBSCRIBE:
      return action.subscribed;
    default:
      return state;
  }
};

const toastReducer = (state = initialState.toast, action) => {
  switch (action.type) {
    case SHOW_TOAST:
      return action.toast;
    case HIDE_TOAST:
      return initialState.toast;
    default:
      return state;
  }
};

const notificationsReducer = (state = initialState.notifications, action) => {
  switch (action.type) {
    case UPDATE_NOTIFICATIONS_STATUS:
      return Object.assign({}, state, {
        status: action.status,
        token: action.token,
      });
    default:
      return state;
  }
};
