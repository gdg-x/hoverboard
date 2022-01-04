import { Failure, Pending, Success } from '@abraham/remotedata';
import { initialMembersState, MembersState } from './state';
import {
  FETCH_MEMBERS,
  FETCH_MEMBERS_FAILURE,
  FETCH_MEMBERS_SUCCESS,
  MembersActions,
} from './types';

export const membersReducer = (
  state = initialMembersState,
  action: MembersActions
): MembersState => {
  switch (action.type) {
    case FETCH_MEMBERS:
      return new Pending();

    case FETCH_MEMBERS_FAILURE:
      return new Failure(action.payload);

    case FETCH_MEMBERS_SUCCESS:
      return new Success(action.payload);

    default:
      return state;
  }
};
