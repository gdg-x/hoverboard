import type { RootState } from '..';
import { type CollectionState, createCollectionSlice } from '../create-collection-slice';
import type { Video } from '../../models/video';
import { subscribeToVideos } from '../../db/videos';

export type VideosState = CollectionState<Video>;

const { reducer, selectOrFetch } = createCollectionSlice<Video>('videos', subscribeToVideos);

export const selectVideos = (state: RootState): VideosState => selectOrFetch(state.videos);

export default reducer;
