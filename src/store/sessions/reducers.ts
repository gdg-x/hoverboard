import { Failure, Pending, Success } from '@abraham/remotedata';
import { initialSessionsState, SessionsState } from './state';
import {
  FETCH_SESSIONS,
  FETCH_SESSIONS_FAILURE,
  FETCH_SESSIONS_SUCCESS,
  SessionsActions,
} from './types';

export const sessionsReducer = (
  state = initialSessionsState,
  action: SessionsActions
): SessionsState => {
  switch (action.type) {
    case FETCH_SESSIONS:
      return new Pending();

    case FETCH_SESSIONS_FAILURE:
      return new Failure(action.payload);

    case FETCH_SESSIONS_SUCCESS:
      return new Success(action.payload);

    default:
      return state;
  }
};
