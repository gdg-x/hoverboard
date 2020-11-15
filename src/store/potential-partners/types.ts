import { PartnerGroup } from '../../models/partner-group';

export const ADD_POTENTIAL_PARTNER = 'app/Partners/ADD_POTENTIAL_PARTNER';
export const ADD_POTENTIAL_PARTNER_FAILURE = 'app/Partners/ADD_POTENTIAL_PARTNER_FAILURE';
export const ADD_POTENTIAL_PARTNER_SUCCESS = 'app/Partners/ADD_POTENTIAL_PARTNER_SUCCESS';

export interface PotentialPartnersState {
  adding: boolean;
  addingError: Error;
}

interface AddPotentialPartnerAction {
  type: typeof ADD_POTENTIAL_PARTNER;
  payload: {
    partner: PartnerGroup;
  };
}

interface AddPotentialPartnerFailureAction {
  type: typeof ADD_POTENTIAL_PARTNER_FAILURE;
  payload: {
    error: Error;
  };
}

interface AddPotentialPartnerSuccessAction {
  type: typeof ADD_POTENTIAL_PARTNER_SUCCESS;
}

export type PotentialPartnerActionTypes =
  | AddPotentialPartnerAction
  | AddPotentialPartnerFailureAction
  | AddPotentialPartnerSuccessAction;
