import { FirebaseError } from 'firebase';
import { Session } from '../../models/session';

export const FETCH_SESSIONS = 'FETCH_SESSIONS';
export const FETCH_SESSIONS_FAILURE = 'FETCH_SESSIONS_FAILURE';
export const FETCH_SESSIONS_SUCCESS = 'FETCH_SESSIONS_SUCCESS';
export const FETCH_USER_FEATURED_SESSIONS = 'FETCH_USER_FEATURED_SESSIONS';
export const FETCH_USER_FEATURED_SESSIONS_FAILURE = 'FETCH_USER_FEATURED_SESSIONS_FAILURE';
export const FETCH_USER_FEATURED_SESSIONS_SUCCESS = 'FETCH_USER_FEATURED_SESSIONS_SUCCESS';
export const SET_USER_FEATURED_SESSIONS = 'SET_USER_FEATURED_SESSIONS';
export const SET_USER_FEATURED_SESSIONS_FAILURE = 'SET_USER_FEATURED_SESSIONS_FAILURE';
export const SET_USER_FEATURED_SESSIONS_SUCCESS = 'SET_USER_FEATURED_SESSIONS_SUCCESS';
export const UPDATE_SESSIONS = 'UPDATE_SESSIONS';

export interface FeaturedSessions {
  [sessionId: string]: boolean;
}

export interface SessionsState {
  fetching: boolean;
  fetchingError: FirebaseError;
  list: Session[];
  obj: {
    [sessionId: string]: Session;
  };
  featured: FeaturedSessions;
  featuredFetching: boolean;
  featuredError: FirebaseError;
}

interface FetchSessionsAction {
  type: typeof FETCH_SESSIONS;
}

interface FetchSessionsFailureAction {
  type: typeof FETCH_SESSIONS_FAILURE;
  payload: {
    error: FirebaseError;
  };
}

interface FetchSessionsSuccessAction {
  type: typeof FETCH_SESSIONS_SUCCESS;
  payload: {
    list: Session[];
    obj: {
      [sessionId: string]: Session;
    };
  };
}

interface FetchUserFeaturedSessionsAction {
  type: typeof FETCH_USER_FEATURED_SESSIONS;
}

interface FetchUserFeaturedSessionsFailureAction {
  type: typeof FETCH_USER_FEATURED_SESSIONS_FAILURE;
  payload: {
    error: FirebaseError;
  };
}

interface FetchUserFeaturedSessionsSuccessAction {
  type: typeof FETCH_USER_FEATURED_SESSIONS_SUCCESS;
  payload: never;
}

interface SetUserFeaturedSessionsAction {
  type: typeof SET_USER_FEATURED_SESSIONS;
}

interface SetUserFeaturedSessionsFailureAction {
  type: typeof SET_USER_FEATURED_SESSIONS_FAILURE;
  payload: {
    error: FirebaseError;
  };
}

interface SetUserFeaturedSessionsSuccessAction {
  type: typeof SET_USER_FEATURED_SESSIONS_SUCCESS;
  payload: {
    featuredSessions: FeaturedSessions;
  };
}

export type SessionsActionTypes =
  | FetchSessionsAction
  | FetchSessionsFailureAction
  | FetchSessionsSuccessAction
  | FetchUserFeaturedSessionsAction
  | FetchUserFeaturedSessionsFailureAction
  | FetchUserFeaturedSessionsSuccessAction
  | SetUserFeaturedSessionsAction
  | SetUserFeaturedSessionsFailureAction
  | SetUserFeaturedSessionsSuccessAction;
