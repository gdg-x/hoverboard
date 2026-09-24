import { RootState } from '..';
import { CollectionState, createCollectionSlice } from '../create-collection-slice';
import { TeamWithoutMembers } from '../../models/team';
import { subscribeToTeams } from '../../db/teams';

export type TeamsState = CollectionState<TeamWithoutMembers>;

const { reducer, selectOrFetch } = createCollectionSlice<TeamWithoutMembers>(
  'teams',
  subscribeToTeams,
);

export const selectTeams = (state: RootState): TeamsState => selectOrFetch(state.teams);

export default reducer;
