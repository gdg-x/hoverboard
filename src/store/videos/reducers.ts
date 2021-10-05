import { Failure, Pending, Success } from '@abraham/remotedata';
import { initialVideosState, VideoState } from './state';
import {
  FetchVideosActions,
  FETCH_VIDEOS,
  FETCH_VIDEOS_FAILURE,
  FETCH_VIDEOS_SUCCESS,
} from './types';

export const videosReducer = (
  state = initialVideosState,
  action: FetchVideosActions
): VideoState => {
  switch (action.type) {
    case FETCH_VIDEOS:
      return new Pending();

    case FETCH_VIDEOS_FAILURE:
      return new Failure(action.payload);

    case FETCH_VIDEOS_SUCCESS:
      return new Success(action.payload);

    default:
      return state;
  }
};
