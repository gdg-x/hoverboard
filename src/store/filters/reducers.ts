import { initialFiltersState } from './state';
import { FiltersActions, SET_FILTERS } from './types';

export const filtersReducer = (state = initialFiltersState, action: FiltersActions) => {
  switch (action.type) {
    case SET_FILTERS:
      return { ...state, ...action.payload };

    default:
      return state;
  }
};
