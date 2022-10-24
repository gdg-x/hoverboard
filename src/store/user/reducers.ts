import { Initialized, Success } from '@abraham/remotedata';
import { initialUserState } from './state';
import { REMOVE_USER, SET_USER, UserActions, UserState } from './types';

export const userReducer = (state = initialUserState, action: UserActions): UserState => {
  switch (action.type) {
    case SET_USER:
      return new Success(action.payload);

    case REMOVE_USER:
      return new Initialized();

    default:
      return state;
  }
};
