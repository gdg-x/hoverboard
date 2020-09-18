import { PartnersState } from './types';

export const initialPartnersState: PartnersState = {
  fetching: false,
  fetchingError: null,
  list: [],
  adding: false,
  addingError: null,
};
