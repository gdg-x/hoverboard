import { Session } from '../../models/session';

export const FETCH_SESSIONS = 'FETCH_SESSIONS';
export const FETCH_SESSIONS_FAILURE = 'FETCH_SESSIONS_FAILURE';
export const FETCH_SESSIONS_SUCCESS = 'FETCH_SESSIONS_SUCCESS';
export const UPDATE_SESSIONS = 'UPDATE_SESSIONS';

export interface SessionsState {
  fetching: boolean;
  fetchingError: Error;
  list: Session[];
  obj: {
    [sessionId: string]: Session;
  };
}

interface FetchSessionsAction {
  type: typeof FETCH_SESSIONS;
}

interface FetchSessionsFailureAction {
  type: typeof FETCH_SESSIONS_FAILURE;
  payload: {
    error: Error;
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

export type SessionsActionTypes =
  | FetchSessionsAction
  | FetchSessionsFailureAction
  | FetchSessionsSuccessAction;
