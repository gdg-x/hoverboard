export const FETCH_USER_FEATURED_SESSIONS = 'FETCH_USER_FEATURED_SESSIONS';
export const FETCH_USER_FEATURED_SESSIONS_FAILURE = 'FETCH_USER_FEATURED_SESSIONS_FAILURE';
export const FETCH_USER_FEATURED_SESSIONS_SUCCESS = 'FETCH_USER_FEATURED_SESSIONS_SUCCESS';
export const SET_USER_FEATURED_SESSIONS = 'SET_USER_FEATURED_SESSIONS';
export const SET_USER_FEATURED_SESSIONS_FAILURE = 'SET_USER_FEATURED_SESSIONS_FAILURE';
export const SET_USER_FEATURED_SESSIONS_SUCCESS = 'SET_USER_FEATURED_SESSIONS_SUCCESS';

export interface FeaturedSessions {
  [sessionId: string]: boolean;
}

export interface FeaturedSessionsState {
  featured: FeaturedSessions;
  featuredFetching: boolean;
  featuredError: Error;
}

interface FetchUserFeaturedSessionsAction {
  type: typeof FETCH_USER_FEATURED_SESSIONS;
}

interface FetchUserFeaturedSessionsFailureAction {
  type: typeof FETCH_USER_FEATURED_SESSIONS_FAILURE;
  payload: {
    error: Error;
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
    error: Error;
  };
}

interface SetUserFeaturedSessionsSuccessAction {
  type: typeof SET_USER_FEATURED_SESSIONS_SUCCESS;
  payload: {
    featuredSessions: FeaturedSessions;
  };
}

export type FeaturedSessionsActions =
  | FetchUserFeaturedSessionsAction
  | FetchUserFeaturedSessionsFailureAction
  | FetchUserFeaturedSessionsSuccessAction
  | SetUserFeaturedSessionsAction
  | SetUserFeaturedSessionsFailureAction
  | SetUserFeaturedSessionsSuccessAction;
