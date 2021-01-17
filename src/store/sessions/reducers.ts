import { initialSessionsState } from './state';
import {
  FETCH_SESSIONS,
  FETCH_SESSIONS_FAILURE,
  FETCH_SESSIONS_SUCCESS,
  SessionsActionTypes,
} from './types';

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

    default:
      return state;
  }
};
