import {
  FETCH_SESSIONS,
  FETCH_SESSIONS_FAILURE,
  FETCH_SESSIONS_SUCCESS,
  FETCH_USER_FEATURED_SESSIONS,
  FETCH_USER_FEATURED_SESSIONS_FAILURE,
  FETCH_USER_FEATURED_SESSIONS_SUCCESS,
  SET_USER_FEATURED_SESSIONS,
  SET_USER_FEATURED_SESSIONS_FAILURE,
  SET_USER_FEATURED_SESSIONS_SUCCESS,
  UPDATE_SESSIONS,
} from '../constants';
import { initialState } from '../initial-state';

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
