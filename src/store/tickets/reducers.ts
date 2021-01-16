import { Failure, Pending, Success } from '@abraham/remotedata';
import { initialTicketsState, TicketsState } from './state';
import {
  FetchTicketsActions,
  FETCH_TICKETS,
  FETCH_TICKETS_FAILURE,
  FETCH_TICKETS_SUCCESS,
} from './types';

export const ticketsReducer = (
  state = initialTicketsState,
  action: FetchTicketsActions
): TicketsState => {
  switch (action.type) {
    case FETCH_TICKETS:
      return new Pending();

    case FETCH_TICKETS_FAILURE:
      return new Failure(action.payload);

    case FETCH_TICKETS_SUCCESS:
      return new Success(action.payload);

    default:
      return state;
  }
};
