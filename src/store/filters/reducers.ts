import { Success } from '@abraham/remotedata';
import { initialFiltersState } from './state';
import { FiltersActions, FiltersState, SET_FILTERS } from './types';

export const filtersReducer = (
  state = initialFiltersState,
  action: FiltersActions
): FiltersState => {
  switch (action.type) {
    case SET_FILTERS:
      return new Success(action.payload);

    default:
      return state;
  }
};
