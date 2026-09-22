import { RootState } from '..';
import { CollectionState, createCollectionSlice } from '../create-collection-slice';
import { PreviousSpeaker } from '../../models/previous-speaker';
import { subscribeToCollection } from '../../utils/firestore';

export type PreviousSpeakersState = CollectionState<PreviousSpeaker>;

const { reducer, selectOrFetch } = createCollectionSlice<PreviousSpeaker>(
  'previousSpeakers',
  (onStart, onNext, onError) => subscribeToCollection('previousSpeakers', onStart, onNext, onError),
);

export const selectPreviousSpeakersState = (state: RootState): PreviousSpeakersState =>
  selectOrFetch(state.previousSpeakers);

export default reducer;
