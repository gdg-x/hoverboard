import { Failure, Pending, Success } from '@abraham/remotedata';
import { FeaturedSessionsState, initialFeaturedSessionsState } from './state';
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
): FeaturedSessionsState => {
  switch (action.type) {
    case FETCH_USER_FEATURED_SESSIONS:
    case SET_USER_FEATURED_SESSIONS:
      return new Pending();

    case FETCH_USER_FEATURED_SESSIONS_FAILURE:
    case SET_USER_FEATURED_SESSIONS_FAILURE:
      return new Failure(action.payload);

    case FETCH_USER_FEATURED_SESSIONS_SUCCESS:
    case SET_USER_FEATURED_SESSIONS_SUCCESS:
      return new Success(action.payload);

    default:
      return state;
  }
};
