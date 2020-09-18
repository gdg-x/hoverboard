import { FirebaseError } from 'firebase';
import { Ticket } from '../../models/ticket';

export const FETCH_TICKETS = 'FETCH_TICKETS';
export const FETCH_TICKETS_FAILURE = 'FETCH_TICKETS_FAILURE';
export const FETCH_TICKETS_SUCCESS = 'FETCH_TICKETS_SUCCESS';

export interface TicketsState {
  fetching: boolean;
  fetchingError: FirebaseError;
  list: Ticket[];
}

interface FetchTicketsAction {
  type: typeof FETCH_TICKETS;
}

interface FetchTicketsFailureAction {
  type: typeof FETCH_TICKETS_FAILURE;
  payload: {
    error: FirebaseError;
  };
}

interface FetchTicketsSeccessAction {
  type: typeof FETCH_TICKETS_SUCCESS;
  payload: {
    list: Ticket[];
  };
}

export type FetchTicketsActionTypes =
  | FetchTicketsAction
  | FetchTicketsFailureAction
  | FetchTicketsSeccessAction;
