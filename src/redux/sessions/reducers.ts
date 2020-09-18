import {
  FETCH_SESSIONS,
  FETCH_SESSIONS_FAILURE,
  FETCH_SESSIONS_SUCCESS,
  FETCH_USER_FEATURED_SESSIONS,
  FETCH_USER_FEATURED_SESSIONS_FAILURE,
  FETCH_USER_FEATURED_SESSIONS_SUCCESS,
  SessionsActionTypes,
  SET_USER_FEATURED_SESSIONS,
  SET_USER_FEATURED_SESSIONS_FAILURE,
  SET_USER_FEATURED_SESSIONS_SUCCESS,
} from './types';
import { initialSessionsState } from './state';

export const sessionsReducer = (state = initialSessionsState, action: SessionsActionTypes) => {
  switch (action.type) {
    case FETCH_SESSIONS:
      return {
        ...state,
        ...{
          fetching: true,
          fetchingError: null,
          list: [],
          obj: {},
        },
      };

    case FETCH_SESSIONS_FAILURE:
      return {
        ...state,
        ...{
          fetching: false,
          fetchingError: action.payload.error,
        },
      };

    case FETCH_SESSIONS_SUCCESS:
      return {
        ...state,
        ...{
          fetching: false,
          list: action.payload.list,
          obj: action.payload.obj,
        },
      };

    case FETCH_USER_FEATURED_SESSIONS:
    case SET_USER_FEATURED_SESSIONS:
      return {
        ...state,
        ...{
          featuredError: null,
          featuredFetching: true,
        },
      };

    case FETCH_USER_FEATURED_SESSIONS_FAILURE:
    case SET_USER_FEATURED_SESSIONS_FAILURE:
      return {
        ...state,
        ...{
          featuredError: action.payload.error,
          featuredFetching: false,
        },
      };

    case FETCH_USER_FEATURED_SESSIONS_SUCCESS:
    case SET_USER_FEATURED_SESSIONS_SUCCESS:
      return {
        ...state,
        ...{
          featured: action.payload.featuredSessions || {},
          featuredFetching: false,
        },
      };

    default:
      return state;
  }
};
