import { Failure, Pending, Success } from '@abraham/remotedata';
import { initialPartnersState, PartnersState } from './state';
import {
  FETCH_PARTNERS,
  FETCH_PARTNERS_FAILURE,
  FETCH_PARTNERS_SUCCESS,
  PartnerActions,
} from './types';

export const partnersReducer = (
  state = initialPartnersState,
  action: PartnerActions
): PartnersState => {
  switch (action.type) {
    case FETCH_PARTNERS:
      return new Pending();

    case FETCH_PARTNERS_FAILURE:
      return new Failure(action.payload);

    case FETCH_PARTNERS_SUCCESS:
      return new Success(action.payload);

    default:
      return state;
  }
};
