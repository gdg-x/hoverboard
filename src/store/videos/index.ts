import { orderBy } from 'firebase/firestore';
import { RootState } from '..';
import { CollectionState, createCollectionSlice } from '../create-collection-slice';
import { Video } from '../../models/video';
import { subscribeToCollection } from '../../utils/firestore';

export type VideosState = CollectionState<Video>;

const { reducer, selectOrFetch } = createCollectionSlice<Video>(
  'videos',
  (onStart, onNext, onError) =>
    subscribeToCollection('videos', onStart, onNext, onError, orderBy('order')),
);

export const selectVideos = (state: RootState): VideosState => selectOrFetch(state.videos);

export default reducer;
