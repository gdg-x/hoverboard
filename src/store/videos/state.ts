import { VideoState } from './types';

export const initialVideosState: VideoState = {
  fetching: false,
  fetchingError: null,
  list: [],
};
