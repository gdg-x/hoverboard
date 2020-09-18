import { FETCH_VIDEOS, FETCH_VIDEOS_FAILURE, FETCH_VIDEOS_SUCCESS } from './types';
import { initialVideosState } from './state';
import { FetchVideosActionTypes } from './types';

export const videosReducer = (state = initialVideosState, action: FetchVideosActionTypes) => {
  switch (action.type) {
    case FETCH_VIDEOS:
      return {
        ...state,
        ...{
          fetching: true,
          fetchingError: null,
          list: [],
        },
      };

    case FETCH_VIDEOS_FAILURE:
      return {
        ...state,
        ...{
          fetching: false,
          fetchingError: action.payload.error,
        },
      };

    case FETCH_VIDEOS_SUCCESS:
      return {
        ...state,
        ...{
          fetching: false,
          list: action.payload.list,
        },
      };

    default:
      return state;
  }
};
