import {
  ADD_POTENTIAL_PARTNER,
  ADD_POTENTIAL_PARTNER_FAILURE,
  ADD_POTENTIAL_PARTNER_SUCCESS,
  FETCH_PARTNERS,
  FETCH_PARTNERS_FAILURE,
  FETCH_PARTNERS_SUCCESS,
} from '../constants';
import { initialState } from '../initial-state';

export const partnersReducer = (state = initialState.partners, action) => {
  switch (action.type) {
    case FETCH_PARTNERS:
      return Object.assign({}, state, {
        fetching: true,
        fetchingError: null,
        list: [],
      });

    case FETCH_PARTNERS_FAILURE:
      return Object.assign({}, state, {
        fetching: false,
        fetchingError: action.payload.error,
      });

    case FETCH_PARTNERS_SUCCESS:
      return Object.assign({}, state, {
        fetching: false,
        list: action.payload.list,
      });

    case ADD_POTENTIAL_PARTNER:
      return Object.assign({}, state, {
        adding: true,
        addingError: null,
      });

    case ADD_POTENTIAL_PARTNER_FAILURE:
      return Object.assign({}, state, {
        adding: false,
        addingError: action.payload.error,
      });

    case ADD_POTENTIAL_PARTNER_SUCCESS:
      return Object.assign({}, state, {
        adding: false,
      });

    default:
      return state;
  }
};
