import { Member } from '../../models/member';

export const FETCH_MEMBERS = 'FETCH_MEMBERS';
export const FETCH_MEMBERS_FAILURE = 'FETCH_MEMBERS_FAILURE';
export const FETCH_MEMBERS_SUCCESS = 'FETCH_MEMBERS_SUCCESS';

interface FetchMembersAction {
  type: typeof FETCH_MEMBERS;
}

interface FetchMembersFailureAction {
  type: typeof FETCH_MEMBERS_FAILURE;
  payload: Error;
}

interface FetchMembersSuccessAction {
  type: typeof FETCH_MEMBERS_SUCCESS;
  payload: Member[];
}

export type MembersActions =
  | FetchMembersAction
  | FetchMembersFailureAction
  | FetchMembersSuccessAction;
