import { PartnerGroup } from '../../models/partner-group';

export const FETCH_PARTNERS = 'FETCH_PARTNERS';
export const FETCH_PARTNERS_FAILURE = 'FETCH_PARTNERS_FAILURE';
export const FETCH_PARTNERS_SUCCESS = 'FETCH_PARTNERS_SUCCESS';

interface FetchPartnersAction {
  type: typeof FETCH_PARTNERS;
}

interface FetchPartnersFailureAction {
  type: typeof FETCH_PARTNERS_FAILURE;
  payload: Error;
}

interface FetchPartnersSuccessAction {
  type: typeof FETCH_PARTNERS_SUCCESS;
  payload: PartnerGroup[];
}

export type PartnerActions =
  | FetchPartnersAction
  | FetchPartnersFailureAction
  | FetchPartnersSuccessAction;
