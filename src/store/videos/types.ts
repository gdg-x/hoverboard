import { Video } from '../../models/video';

export const FETCH_VIDEOS = 'FETCH_VIDEOS';
export const FETCH_VIDEOS_FAILURE = 'FETCH_VIDEOS_FAILURE';
export const FETCH_VIDEOS_SUCCESS = 'FETCH_VIDEOS_SUCCESS';

interface FetchVideosAction {
  type: typeof FETCH_VIDEOS;
}

interface FetchVideosFailureAction {
  type: typeof FETCH_VIDEOS_FAILURE;
  payload: Error;
}

interface FetchVideosSuccessAction {
  type: typeof FETCH_VIDEOS_SUCCESS;
  payload: Video[];
}

export type FetchVideosActions =
  | FetchVideosAction
  | FetchVideosFailureAction
  | FetchVideosSuccessAction;
