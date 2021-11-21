import { initialPotentialPartnersState } from './state';
import {
  ADD_POTENTIAL_PARTNER,
  ADD_POTENTIAL_PARTNER_FAILURE,
  ADD_POTENTIAL_PARTNER_SUCCESS,
  PotentialPartnerActions,
} from './types';

export const potentialPartnersReducer = (
  state = initialPotentialPartnersState,
  action: PotentialPartnerActions
) => {
  switch (action.type) {
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
