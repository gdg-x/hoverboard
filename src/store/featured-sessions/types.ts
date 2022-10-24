import { FeaturedSessions } from './state';

export const FETCH_USER_FEATURED_SESSIONS = 'FETCH_USER_FEATURED_SESSIONS';
export const FETCH_USER_FEATURED_SESSIONS_FAILURE = 'FETCH_USER_FEATURED_SESSIONS_FAILURE';
export const FETCH_USER_FEATURED_SESSIONS_SUCCESS = 'FETCH_USER_FEATURED_SESSIONS_SUCCESS';
export const SET_USER_FEATURED_SESSIONS = 'SET_USER_FEATURED_SESSIONS';
export const SET_USER_FEATURED_SESSIONS_FAILURE = 'SET_USER_FEATURED_SESSIONS_FAILURE';
export const SET_USER_FEATURED_SESSIONS_SUCCESS = 'SET_USER_FEATURED_SESSIONS_SUCCESS';
export const REMOVE_USER_FEATURED_SESSIONS = 'REMOVE_USER_FEATURED_SESSIONS';

interface FetchUserFeaturedSessionsAction {
  type: typeof FETCH_USER_FEATURED_SESSIONS;
}

interface FetchUserFeaturedSessionsFailureAction {
  type: typeof FETCH_USER_FEATURED_SESSIONS_FAILURE;
  payload: Error;
}

interface FetchUserFeaturedSessionsSuccessAction {
  type: typeof FETCH_USER_FEATURED_SESSIONS_SUCCESS;
  payload: FeaturedSessions;
}

interface SetUserFeaturedSessionsAction {
  type: typeof SET_USER_FEATURED_SESSIONS;
}

interface SetUserFeaturedSessionsFailureAction {
  type: typeof SET_USER_FEATURED_SESSIONS_FAILURE;
  payload: Error;
}

interface SetUserFeaturedSessionsSuccessAction {
  type: typeof SET_USER_FEATURED_SESSIONS_SUCCESS;
  payload: FeaturedSessions;
}

interface RemoveUserFeaturedSessionsAction {
  type: typeof REMOVE_USER_FEATURED_SESSIONS;
}

export type FeaturedSessionsActions =
  | FetchUserFeaturedSessionsAction
  | FetchUserFeaturedSessionsFailureAction
  | FetchUserFeaturedSessionsSuccessAction
  | SetUserFeaturedSessionsAction
  | SetUserFeaturedSessionsFailureAction
  | SetUserFeaturedSessionsSuccessAction
  | RemoveUserFeaturedSessionsAction;
