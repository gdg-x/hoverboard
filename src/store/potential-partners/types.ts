export const ADD_POTENTIAL_PARTNER = 'ADD_POTENTIAL_PARTNER';
export const ADD_POTENTIAL_PARTNER_FAILURE = 'ADD_POTENTIAL_PARTNER_FAILURE';
export const ADD_POTENTIAL_PARTNER_SUCCESS = 'ADD_POTENTIAL_PARTNER_SUCCESS';

interface AddPotentialPartnerAction {
  type: typeof ADD_POTENTIAL_PARTNER;
}

interface AddPotentialPartnerFailureAction {
  type: typeof ADD_POTENTIAL_PARTNER_FAILURE;
  payload: Error;
}

interface AddPotentialPartnerSuccessAction {
  type: typeof ADD_POTENTIAL_PARTNER_SUCCESS;
}

export type PotentialPartnerActions =
  | AddPotentialPartnerAction
  | AddPotentialPartnerFailureAction
  | AddPotentialPartnerSuccessAction;
