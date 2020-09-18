import { initialTicketsState } from './state';
import {
  FetchTicketsActionTypes,
  FETCH_TICKETS,
  FETCH_TICKETS_FAILURE,
  FETCH_TICKETS_SUCCESS,
} from './types';

export const ticketsReducer = (state = initialTicketsState, action: FetchTicketsActionTypes) => {
  switch (action.type) {
    case FETCH_TICKETS:
      return {
        ...state,
        ...{
          fetching: true,
          fetchingError: null,
          list: [],
        },
      };

    case FETCH_TICKETS_FAILURE:
      return {
        ...state,
        ...{
          fetching: false,
          fetchingError: action.payload.error,
        },
      };

    case FETCH_TICKETS_SUCCESS:
      return {
        ...state,
        ...{
          fetching: false,
          list: action.payload.list,
        },
      };

    default:
      return state;
  }
};
