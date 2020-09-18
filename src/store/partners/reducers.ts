import {
  ADD_POTENTIAL_PARTNER,
  ADD_POTENTIAL_PARTNER_FAILURE,
  ADD_POTENTIAL_PARTNER_SUCCESS,
  FETCH_PARTNERS,
  FETCH_PARTNERS_FAILURE,
  FETCH_PARTNERS_SUCCESS,
} from './types';
import { initialPartnersState } from './state';
import { PartnerActionTypes } from './types';

export const partnersReducer = (state = initialPartnersState, action: PartnerActionTypes) => {
  switch (action.type) {
    case FETCH_PARTNERS:
      return {
        ...state,
        ...{
          fetching: true,
          fetchingError: null,
          list: [],
        },
      };

    case FETCH_PARTNERS_FAILURE:
      return {
        ...state,
        ...{
          fetching: false,
          fetchingError: action.payload.error,
        },
      };

    case FETCH_PARTNERS_SUCCESS:
      return {
        ...state,
        ...{
          fetching: false,
          list: action.payload.list,
        },
      };

    case ADD_POTENTIAL_PARTNER:
      return {
        ...state,
        ...{
          adding: true,
          addingError: null,
        },
      };

    case ADD_POTENTIAL_PARTNER_FAILURE:
      return {
        ...state,
        ...{
          adding: false,
          addingError: action.payload.error,
        },
      };

    case ADD_POTENTIAL_PARTNER_SUCCESS:
      return {
        ...state,
        ...{
          adding: false,
        },
      };

    default:
      return state;
  }
};
