import { User } from '../../models/user';

export const SIGN_IN = 'SIGN_IN';
export const SIGN_OUT = 'SIGN_OUT';

interface SignInAction {
  type: typeof SIGN_IN;
  payload: User;
}

interface SignOutAction {
  type: typeof SIGN_OUT;
}

export type UserActions = SignInAction | SignOutAction;
