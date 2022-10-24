import { Success } from '@abraham/remotedata';
import { RootState } from '..';

export const selectUser = (state: RootState) => state.user;

export const selectUserId = (state: RootState) => {
  if (state.user instanceof Success) {
    return state.user.data.uid;
  } else {
    return undefined;
  }
};
