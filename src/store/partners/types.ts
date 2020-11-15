import { PartnerGroup } from '../../models/partner-group';

export const FETCH_PARTNERS = 'app/Partners/FETCH_PARTNERS';
export const FETCH_PARTNERS_FAILURE = 'app/Partners/FETCH_PARTNERS_FAILURE';
export const FETCH_PARTNERS_SUCCESS = 'app/Partners/FETCH_PARTNERS_SUCCESS';

export interface PartnersState {
  fetching: boolean;
  fetchingError: Error;
  list: PartnerGroup[];
}

interface FetchPartnersAction {
  type: typeof FETCH_PARTNERS;
}

interface FetchPartnersFailureAction {
  type: typeof FETCH_PARTNERS_FAILURE;
  payload: {
    error: Error;
  };
}

interface FetchPartnersSuccessAction {
  type: typeof FETCH_PARTNERS_SUCCESS;
  payload: {
    list: PartnerGroup[];
  };
}

export type PartnerActionTypes =
  | FetchPartnersAction
  | FetchPartnersFailureAction
  | FetchPartnersSuccessAction;
