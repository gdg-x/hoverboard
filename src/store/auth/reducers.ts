import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { initialAuthState } from './state';
import { AUTH, AuthActions, AuthState, AUTH_FAILURE, AUTH_SUCCESS, UN_AUTH } from './types';

export const authReducer = (state = initialAuthState, action: AuthActions): AuthState => {
  switch (action.type) {
    case AUTH:
      return new Pending();

    case AUTH_SUCCESS:
      return new Success(action.payload);

    case AUTH_FAILURE:
      return new Failure(action.payload);

    case UN_AUTH:
      return new Initialized();

    default:
      return state;
  }
};
