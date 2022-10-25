import { RemoteData } from '@abraham/remotedata';
import { User } from '../../models/user';

export const SET_USER = 'SET_USER';
export const REMOVE_USER = 'REMOVE_USER';

export type UserState = RemoteData<Error, User>;

interface SetUserAction {
  type: typeof SET_USER;
  payload: User;
}

interface RemoveUserAction {
  type: typeof REMOVE_USER;
}

export type UserActions = SetUserAction | RemoveUserAction;
