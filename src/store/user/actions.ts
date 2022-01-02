import { store } from '..';
import { FirebaseUser, toUser } from '../../models/user';
import { REMOVE_USER, SET_USER, UserActions } from './types';

export const setUser = (user: FirebaseUser) => {
  store.dispatch<UserActions>({ type: SET_USER, payload: toUser(user) });
};

export const removeUser = () => {
  store.dispatch<UserActions>({ type: REMOVE_USER });
};
