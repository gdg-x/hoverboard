import type { RootState } from '..';
import { type CollectionState, createCollectionSlice } from '../create-collection-slice';
import type { Session } from '../../models/session';
import { subscribeToSessions } from '../../db/sessions';

/** The `sessions` documents as they are. `selectSessionsState` in `../schedule` builds them. */
export type RawSessionsState = CollectionState<Session>;

const { reducer, selectOrFetch } = createCollectionSlice<Session>('sessions', subscribeToSessions);

export const selectRawSessionsState = (state: RootState): RawSessionsState =>
  selectOrFetch(state.sessions);

export default reducer;
