import { Initialized, Success } from '@abraham/remotedata';
import { RootState, store } from '..';
import { fetchUserFeaturedSessions } from './actions';
import { FeaturedSessions } from './state';

export const selectFeaturedSessions = (state: RootState): FeaturedSessions => {
  const { featuredSessions } = state;

  if (featuredSessions instanceof Success) {
    return featuredSessions.data;
  } else if (featuredSessions instanceof Initialized) {
    store.dispatch(fetchUserFeaturedSessions);
  }

  return {};
};
