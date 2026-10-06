import type { RootState } from '..';
import { type CollectionState, createCollectionSlice } from '../create-collection-slice';
import type { Photo } from '../../models/photo';
import { subscribeToGallery } from '../../db/gallery';

export type GalleryState = CollectionState<Photo>;

const { reducer, selectOrFetch } = createCollectionSlice<Photo>('gallery', subscribeToGallery);

export const selectGallery = (state: RootState): GalleryState => selectOrFetch(state.gallery);

export default reducer;
