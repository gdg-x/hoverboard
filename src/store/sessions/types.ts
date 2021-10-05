import { Session } from '../../models/session';

export const FETCH_SESSIONS = 'FETCH_SESSIONS';
export const FETCH_SESSIONS_FAILURE = 'FETCH_SESSIONS_FAILURE';
export const FETCH_SESSIONS_SUCCESS = 'FETCH_SESSIONS_SUCCESS';

interface FetchSessionsAction {
  type: typeof FETCH_SESSIONS;
}

interface FetchSessionsFailureAction {
  type: typeof FETCH_SESSIONS_FAILURE;
  payload: Error;
}

interface FetchSessionsSuccessAction {
  type: typeof FETCH_SESSIONS_SUCCESS;
  payload: Session[];
}

export type SessionsActions =
  | FetchSessionsAction
  | FetchSessionsFailureAction
  | FetchSessionsSuccessAction;
