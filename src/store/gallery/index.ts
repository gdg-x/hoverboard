import { orderBy } from 'firebase/firestore';
import { RootState } from '..';
import { CollectionState, createCollectionSlice } from '../create-collection-slice';
import { Photo } from '../../models/photo';
import { subscribeToCollection } from '../../utils/firestore';

export type GalleryState = CollectionState<Photo>;

const { reducer, selectOrFetch } = createCollectionSlice<Photo>(
  'gallery',
  (onStart, onNext, onError) =>
    subscribeToCollection('gallery', onStart, onNext, onError, orderBy('order')),
);

export const selectGallery = (state: RootState): GalleryState => selectOrFetch(state.gallery);

export default reducer;
