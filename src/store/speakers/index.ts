import { RootState } from '..';
import { CollectionState, createCollectionSlice } from '../create-collection-slice';
import { SpeakerWithTags } from '../../models/speaker';
import { subscribeToCollection } from '../../utils/firestore';

export type SpeakersState = CollectionState<SpeakerWithTags>;

const { reducer, selectOrFetch } = createCollectionSlice<SpeakerWithTags>(
  'speakers',
  (onStart, onNext, onError) =>
    subscribeToCollection('generatedSpeakers', onStart, onNext, onError),
);

export const selectSpeakersState = (state: RootState): SpeakersState =>
  selectOrFetch(state.speakers);

export default reducer;
