import { SET_FILTERS } from '../constants';
import { initialState } from '../initial-state';

export const filtersReducer = (state = initialState.filters, action) => {
  switch (action.type) {
    case SET_FILTERS:
      return Object.assign({}, state, action.payload);
    default:
      return state;
  }
};
