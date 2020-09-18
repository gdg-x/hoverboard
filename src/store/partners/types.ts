import { FirebaseError } from 'firebase';
import { Partner } from '../../models/partner';

export const FETCH_PARTNERS = 'app/Partners/FETCH_PARTNERS';
export const FETCH_PARTNERS_FAILURE = 'app/Partners/FETCH_PARTNERS_FAILURE';
export const FETCH_PARTNERS_SUCCESS = 'app/Partners/FETCH_PARTNERS_SUCCESS';
export const ADD_POTENTIAL_PARTNER = 'app/Partners/ADD_POTENTIAL_PARTNER';
export const ADD_POTENTIAL_PARTNER_FAILURE = 'app/Partners/ADD_POTENTIAL_PARTNER_FAILURE';
export const ADD_POTENTIAL_PARTNER_SUCCESS = 'app/Partners/ADD_POTENTIAL_PARTNER_SUCCESS';

export interface PartnersState {
  fetching: boolean;
  fetchingError: FirebaseError;
  list: Partner[];
  adding: boolean;
  addingError: FirebaseError;
}

interface FetchPartnersAction {
  type: typeof FETCH_PARTNERS;
}

interface FetchPartnersFailureAction {
  type: typeof FETCH_PARTNERS_FAILURE;
  payload: {
    error: FirebaseError;
  };
}

interface FetchPartnersSuccessAction {
  type: typeof FETCH_PARTNERS_SUCCESS;
  payload: {
    list: Partner[];
  };
}

interface AddPotentialPartnerAction {
  type: typeof ADD_POTENTIAL_PARTNER;
  payload: {
    partner: Partner;
  };
}

interface AddPotentialPartnerFailureAction {
  type: typeof ADD_POTENTIAL_PARTNER_FAILURE;
  payload: {
    error: FirebaseError;
  };
}

interface AddPotentialPartnerSuccessAction {
  type: typeof ADD_POTENTIAL_PARTNER_SUCCESS;
}

export type PartnerActionTypes =
  | FetchPartnersAction
  | FetchPartnersFailureAction
  | FetchPartnersSuccessAction
  | AddPotentialPartnerAction
  | AddPotentialPartnerFailureAction
  | AddPotentialPartnerSuccessAction;
