import { RootState } from '..';
import { CollectionState, createCollectionSlice } from '../create-collection-slice';
import { Photo } from '../../models/photo';
import { subscribeToGallery } from '../../db/gallery';

export type GalleryState = CollectionState<Photo>;

const { reducer, selectOrFetch } = createCollectionSlice<Photo>('gallery', subscribeToGallery);

export const selectGallery = (state: RootState): GalleryState => selectOrFetch(state.gallery);

export default reducer;
