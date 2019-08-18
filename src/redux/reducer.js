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
  FETCH_SCHEDULE_SUCCESS,
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
  OPEN_DIALOG,
  SEND_FEEDBACK_FAILURE,
  SEND_FEEDBACK_SUCCESS,
  SEND_FEEDBACK,
  SET_ADD_TO_HOMESCREEN,
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
  SIGN_OUT,
  SUBSCRIBE,
  TOGGLE_DRAWER,
  TOGGLE_VIDEO_DIALOG,
  UPDATE_NOTIFICATIONS_STATUS,
  UPDATE_SESSIONS,
  WIPE_PREVIOUS_FEEDBACK,
} from './constants.js';
import { initialState } from './initial-state.js';

export const uiReducer = (state = initialState.ui, action) => {
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
    case SET_ADD_TO_HOMESCREEN:
      return Object.assign({}, state, {
        addToHomescreen: action.value,
      });
    default:
      return state;
  }
};

export const routingReducer = (state = initialState.routing, action) => {
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

export const dialogsReducer = (state = initialState.dialogs, action) => {
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

export const ticketsReducer = (state = initialState.tickets, action) => {
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

export const partnersReducer = (state = initialState.partners, action) => {
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

export const feedbackReducer = (state = initialState.feedback, action) => {
  switch (action.type) {
    case FETCH_PREVIOUS_FEEDBACK:
      return Object.assign({}, state, {
        fetching: true,
        fetchingError: null,
      });

    case FETCH_PREVIOUS_FEEDBACK_FAILURE:
      return Object.assign({}, state, {
        fetching: false,
        fetchingError: action.payload.error,
      });

    case FETCH_PREVIOUS_FEEDBACK_SUCCESS:
      return Object.assign({}, state, {
        fetching: false,
        [action.payload.collection]: Object.assign(
            {},
            state[action.payload.collection],
            { [action.payload.dbItem]: action.payload.previousFeedback },
        ),
      });

    case SEND_FEEDBACK:
      return Object.assign({}, state, {
        adding: true,
        addingError: null,
      });

    case SEND_FEEDBACK_FAILURE:
      return Object.assign({}, state, {
        adding: false,
        addingError: action.payload.error,
      });

    case SEND_FEEDBACK_SUCCESS:
      return Object.assign({}, state, {
        adding: false,
        [action.payload.collection]:
          Object.assign({}, state[action.payload.collection], {
            [action.payload.dbItem]: {
              contentRating: action.payload.contentRating,
              styleRating: action.payload.styleRating,
              comment: action.payload.comment,
            },
          }),
      });

    case DELETE_FEEDBACK:
      return Object.assign({}, state, {
        deleting: true,
        deletingError: null,
      });

    case DELETE_FEEDBACK_FAILURE:
      return Object.assign({}, state, {
        deleting: false,
        deletingError: action.payload.error,
      });

    case DELETE_FEEDBACK_SUCCESS:
      return Object.assign({}, state, {
        deleting: false,
        [action.payload.collection]: {
          [action.payload.dbItem]: null,
        },
      });

    case WIPE_PREVIOUS_FEEDBACK:
      return initialState.feedback;

    default:
      return state;
  }
};

export const videosReducer = (state = initialState.videos, action) => {
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

export const blogReducer = (state = initialState.blog, action) => {
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

export const speakersReducer = (state = initialState.speakers, action) => {
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

export const previousSpeakersReducer = (state = initialState.previousSpeakers, action) => {
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

export const sessionsReducer = (state = initialState.sessions, action) => {
  switch (action.type) {
    case FETCH_SESSIONS:
      return Object.assign({}, state, {
        fetching: true,
        fetchingError: null,
        list: [],
        obj: {},
        objBySpeaker: {},
      });

    case FETCH_SESSIONS_FAILURE:
      return Object.assign({}, state, {
        fetching: false,
        fetchingError: action.payload.error,
      });

    case FETCH_SESSIONS_SUCCESS:
      return Object.assign({}, state, {
        fetching: false,
        list: action.payload.list,
        obj: action.payload.obj,
        objBySpeaker: action.payload.objBySpeaker,
      });

    case UPDATE_SESSIONS:
      return Object.assign({}, state, {
        list: action.payload.list,
        obj: action.payload.obj,
        objBySpeaker: action.payload.objBySpeaker,
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

export const scheduleReducer = (state = initialState.schedule, action) => {
  switch (action.type) {
    case FETCH_SCHEDULE_SUCCESS:
      return action.data;
    default:
      return state;
  }
};

export const galleryReducer = (state = initialState.gallery, action) => {
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

export const teamReducer = (state = initialState.team, action) => {
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

export const userReducer = (state = initialState.user, action) => {
  switch (action.type) {
    case SIGN_IN:
    case SIGN_OUT:
      return action.user;
    default:
      return state;
  }
};

export const subscribeReducer = (state = initialState.subscribed, action) => {
  switch (action.type) {
    case SUBSCRIBE:
      return action.subscribed;
    default:
      return state;
  }
};

export const toastReducer = (state = initialState.toast, action) => {
  switch (action.type) {
    case SHOW_TOAST:
      return action.toast;
    case HIDE_TOAST:
      return initialState.toast;
    default:
      return state;
  }
};

export const notificationsReducer = (state = initialState.notifications, action) => {
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

export const filtersReducer = (state = initialState.filters, action) => {
  switch (action.type) {
    case SET_FILTERS:
      return Object.assign({}, state, action.payload);
    default:
      return state;
  }
};

export const appReducer = (state = initialState, action) => {
  return {
    ui: uiReducer(state.ui, action),
    routing: routingReducer(state.routing, action),
    dialogs: dialogsReducer(state.dialogs, action),
    tickets: ticketsReducer(state.tickets, action),
    partners: partnersReducer(state.partners, action),
    feedback: feedbackReducer(state.feedback, action),
    videos: videosReducer(state.videos, action),
    blog: blogReducer(state.blog, action),
    speakers: speakersReducer(state.speakers, action),
    previousSpeakers: previousSpeakersReducer(state.previousSpeakers, action),
    sessions: sessionsReducer(state.sessions, action),
    schedule: scheduleReducer(state.schedule, action),
    gallery: galleryReducer(state.gallery, action),
    team: teamReducer(state.team, action),
    user: userReducer(state.user, action),
    subscribed: subscribeReducer(state.subscribed, action),
    toast: toastReducer(state.toast, action),
    notifications: notificationsReducer(state.notifications, action),
    filters: filtersReducer(state.filters, action),
  };
};
