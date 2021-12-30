import { Initialized, Pending } from '@abraham/remotedata';
import { RootState, store } from '..';
import { fetchTeams } from './actions';
import { TeamsState } from './state';

export const selectTeams = (state: RootState): TeamsState => {
  if (state.teams instanceof Initialized) {
    store.dispatch(fetchTeams);
    return new Pending();
  } else {
    return state.teams;
  }
};
