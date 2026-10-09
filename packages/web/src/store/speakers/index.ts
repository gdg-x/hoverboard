import type { RootState } from '..';
import { type CollectionState, createCollectionSlice } from '../create-collection-slice';
import type { Speaker } from '../../models/speaker';
import { subscribeToSpeakers } from '../../db/speakers';

/** The `speakers` documents as they are. `selectSpeakersState` in `../schedule` builds them. */
export type RawSpeakersState = CollectionState<Speaker>;

const { reducer, selectOrFetch } = createCollectionSlice<Speaker>('speakers', subscribeToSpeakers);

export const selectRawSpeakersState = (state: RootState): RawSpeakersState =>
  selectOrFetch(state.speakers);

export default reducer;
