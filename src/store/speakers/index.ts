import { RootState } from '..';
import { CollectionState, createCollectionSlice } from '../create-collection-slice';
import { SpeakerWithTags } from '../../models/speaker';
import { subscribeToSpeakers } from '../../db/speakers';

export type SpeakersState = CollectionState<SpeakerWithTags>;

const { reducer, selectOrFetch } = createCollectionSlice<SpeakerWithTags>(
  'speakers',
  subscribeToSpeakers,
);

export const selectSpeakersState = (state: RootState): SpeakersState =>
  selectOrFetch(state.speakers);

export default reducer;
