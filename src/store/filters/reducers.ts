import { initialFiltersState } from './state';
import { FiltersActionTypes, SET_FILTERS } from './types';

export const filtersReducer = (state = initialFiltersState, action: FiltersActionTypes) => {
  switch (action.type) {
    case SET_FILTERS:
      return { ...state, ...action.payload };
    default:
      return state;
  }
};
