import { initialFeaturedSessionsState } from './state';
import {
  FETCH_USER_FEATURED_SESSIONS,
  FETCH_USER_FEATURED_SESSIONS_FAILURE,
  FETCH_USER_FEATURED_SESSIONS_SUCCESS,
  FeaturedSessionsActions,
  SET_USER_FEATURED_SESSIONS,
  SET_USER_FEATURED_SESSIONS_FAILURE,
  SET_USER_FEATURED_SESSIONS_SUCCESS,
} from './types';

export const featuredSessionsReducer = (
  state = initialFeaturedSessionsState,
  action: FeaturedSessionsActions
) => {
  switch (action.type) {
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
