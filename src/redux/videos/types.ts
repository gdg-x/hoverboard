import { FirebaseError } from 'firebase';
import { Video } from '../../models/video';

export const FETCH_VIDEOS = 'FETCH_VIDEOS';
export const FETCH_VIDEOS_FAILURE = 'FETCH_VIDEOS_FAILURE';
export const FETCH_VIDEOS_SUCCESS = 'FETCH_VIDEOS_SUCCESS';

export interface VideoState {
  fetching: boolean;
  fetchingError?: FirebaseError;
  list: Video[];
}

interface FetchVideosAction {
  type: typeof FETCH_VIDEOS;
}

interface FetchVideosFailureAction {
  type: typeof FETCH_VIDEOS_FAILURE;
  payload: {
    error: FirebaseError;
  };
}

interface FetchVideosSuccessAction {
  type: typeof FETCH_VIDEOS_SUCCESS;
  payload: {
    list: Video[];
  };
}

export type FetchVideosActionTypes =
  | FetchVideosAction
  | FetchVideosFailureAction
  | FetchVideosSuccessAction;
