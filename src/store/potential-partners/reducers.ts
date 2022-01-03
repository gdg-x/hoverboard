import { Failure, Pending, Success } from '@abraham/remotedata';
import { initialPotentialPartnersState, PotentialPartnersState } from './state';
import {
  ADD_POTENTIAL_PARTNER,
  ADD_POTENTIAL_PARTNER_FAILURE,
  ADD_POTENTIAL_PARTNER_SUCCESS,
  PotentialPartnerActions,
} from './types';

export const potentialPartnersReducer = (
  state = initialPotentialPartnersState,
  action: PotentialPartnerActions
): PotentialPartnersState => {
  switch (action.type) {
    case ADD_POTENTIAL_PARTNER:
      return new Pending();

    case ADD_POTENTIAL_PARTNER_FAILURE:
      return new Failure(action.payload);

    case ADD_POTENTIAL_PARTNER_SUCCESS:
      return new Success(true);

    default:
      return state;
  }
};
