import { RootState } from '..';
import { CollectionState, createCollectionSlice } from '../create-collection-slice';
import { Member } from '../../models/member';
import { subscribeToMembers } from '../../db/members';

export type MembersState = CollectionState<Member>;

const { reducer, selectOrFetch } = createCollectionSlice<Member>('members', subscribeToMembers);

export const selectMembers = (state: RootState): MembersState => selectOrFetch(state.members);

export default reducer;
