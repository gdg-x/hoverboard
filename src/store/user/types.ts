import { AuthenticatedUser, UnauthenticatedUser } from '../../models/user';

export const SIGN_IN = 'SIGN_IN';
export const SIGN_OUT = 'SIGN_OUT';

export interface UserState {
  signedIn: boolean;
}

interface SignInAction {
  type: typeof SIGN_IN;
  user: AuthenticatedUser;
}

interface SignOutAction {
  type: typeof SIGN_OUT;
  user: UnauthenticatedUser;
}

export type UserActionTypes = SignInAction | SignOutAction;
