import { initialUserState } from './state';
import { SIGN_IN, SIGN_OUT, UserActionTypes } from './types';

export const userReducer = (state = initialUserState, action: UserActionTypes) => {
  switch (action.type) {
    case SIGN_IN:
      return action.user;
    case SIGN_OUT:
      return action.user;
    default:
      return state;
  }
};
