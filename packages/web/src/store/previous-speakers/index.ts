import { RootState } from '..';
import { CollectionState, createCollectionSlice } from '../create-collection-slice';
import { PreviousSpeaker } from '../../models/previous-speaker';
import { subscribeToPreviousSpeakers } from '../../db/previous-speakers';

export type PreviousSpeakersState = CollectionState<PreviousSpeaker>;

const { reducer, selectOrFetch } = createCollectionSlice<PreviousSpeaker>(
  'previousSpeakers',
  subscribeToPreviousSpeakers,
);

export const selectPreviousSpeakersState = (state: RootState): PreviousSpeakersState =>
  selectOrFetch(state.previousSpeakers);

export default reducer;
