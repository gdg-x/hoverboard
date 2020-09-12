import { SIGN_IN, SIGN_OUT } from '../constants';
import { initialState } from '../initial-state';

export const userReducer = (state = initialState.user, action) => {
  switch (action.type) {
    case SIGN_IN:
    case SIGN_OUT:
      return action.user;
    default:
      return state;
  }
};
