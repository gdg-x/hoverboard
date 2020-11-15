import { initialPartnersState } from './state';
import {
  FETCH_PARTNERS,
  FETCH_PARTNERS_FAILURE,
  FETCH_PARTNERS_SUCCESS,
  PartnerActionTypes,
} from './types';

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

    default:
      return state;
  }
};
