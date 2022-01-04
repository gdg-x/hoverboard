import { Initialized, Pending } from '@abraham/remotedata';
import { RootState, store } from '..';
import { fetchMembers } from './actions';
import { MembersState } from './state';

export const selectMembers = (state: RootState): MembersState => {
  if (state.members instanceof Initialized) {
    store.dispatch(fetchMembers);
    return new Pending();
  } else {
    return state.members;
  }
};
