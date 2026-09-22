import { orderBy } from 'firebase/firestore';
import { RootState } from '..';
import { CollectionState, createCollectionSlice } from '../create-collection-slice';
import { TeamWithoutMembers } from '../../models/team';
import { subscribeToCollection } from '../../utils/firestore';

export type TeamsState = CollectionState<TeamWithoutMembers>;

const { reducer, selectOrFetch } = createCollectionSlice<TeamWithoutMembers>(
  'teams',
  (onStart, onNext, onError) =>
    subscribeToCollection('team', onStart, onNext, onError, orderBy('title')),
);

export const selectTeams = (state: RootState): TeamsState => selectOrFetch(state.teams);

export default reducer;
