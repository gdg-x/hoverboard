import { Initialized, Success } from '@abraham/remotedata';
import { initialUserState, UserState } from './state';
import { SIGN_IN, SIGN_OUT, UserActions } from './types';

export const userReducer = (state = initialUserState, action: UserActions): UserState => {
  switch (action.type) {
    case SIGN_IN:
      return new Success(action.payload);

    case SIGN_OUT:
      return new Initialized();

    default:
      return state;
  }
};
