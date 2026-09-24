import { RootState } from '..';
import { CollectionState, createCollectionSlice } from '../create-collection-slice';
import { Session } from '../../models/session';
import { subscribeToSessions } from '../../db/sessions';

export type SessionsState = CollectionState<Session>;

const { reducer, selectOrFetch } = createCollectionSlice<Session>('sessions', subscribeToSessions);

export const selectSessionsState = (state: RootState): SessionsState =>
  selectOrFetch(state.sessions);

export default reducer;
