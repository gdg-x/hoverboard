import { TicketsState } from './types';

export const initialTicketsState: TicketsState = {
  fetching: false,
  fetchingError: null,
  list: [],
};
