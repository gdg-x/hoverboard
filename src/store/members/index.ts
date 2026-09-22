import { RootState } from '..';
import { CollectionState, createCollectionSlice } from '../create-collection-slice';
import { Member } from '../../models/member';
import { subscribeToCollectionGroup } from '../../utils/firestore';

export type MembersState = CollectionState<Member>;

const { reducer, selectOrFetch } = createCollectionSlice<Member>(
  'members',
  (onStart, onNext, onError) => subscribeToCollectionGroup('members', onStart, onNext, onError),
);

export const selectMembers = (state: RootState): MembersState => selectOrFetch(state.members);

export default reducer;
