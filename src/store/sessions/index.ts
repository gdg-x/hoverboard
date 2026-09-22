import { orderBy } from 'firebase/firestore';
import { RootState } from '..';
import { CollectionState, createCollectionSlice } from '../create-collection-slice';
import { Session } from '../../models/session';
import { subscribeToCollection } from '../../utils/firestore';

export type SessionsState = CollectionState<Session>;

const { reducer, selectOrFetch } = createCollectionSlice<Session>(
  'sessions',
  (onStart, onNext, onError) =>
    subscribeToCollection('generatedSessions', onStart, onNext, onError, orderBy('id')),
);

export const selectSessionsState = (state: RootState): SessionsState =>
  selectOrFetch(state.sessions);

export default reducer;
