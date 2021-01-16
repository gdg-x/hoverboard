import { Ticket } from '../../models/ticket';

export const FETCH_TICKETS = 'FETCH_TICKETS';
export const FETCH_TICKETS_FAILURE = 'FETCH_TICKETS_FAILURE';
export const FETCH_TICKETS_SUCCESS = 'FETCH_TICKETS_SUCCESS';

interface FetchTicketsAction {
  type: typeof FETCH_TICKETS;
}

interface FetchTicketsFailureAction {
  type: typeof FETCH_TICKETS_FAILURE;
  payload: Error;
}

interface FetchTicketsSeccessAction {
  type: typeof FETCH_TICKETS_SUCCESS;
  payload: Ticket[];
}

export type FetchTicketsActions =
  | FetchTicketsAction
  | FetchTicketsFailureAction
  | FetchTicketsSeccessAction;
