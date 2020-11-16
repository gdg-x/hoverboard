import { FETCH_VIDEOS, FETCH_VIDEOS_FAILURE, FETCH_VIDEOS_SUCCESS } from './types';
import { initialVideosState } from './state';
import { FetchVideosActions } from './types';
import { Failure, Pending, Success } from '@abraham/remotedata';

export const videosReducer = (state = initialVideosState, action: FetchVideosActions) => {
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
