import { initialGalleryState } from './store';
import {
  FETCH_GALLERY,
  FETCH_GALLERY_FAILURE,
  FETCH_GALLERY_SUCCESS,
  GalleryActionTypes,
} from './types';

export const galleryReducer = (state = initialGalleryState, action: GalleryActionTypes) => {
  switch (action.type) {
    case FETCH_GALLERY:
      return {
        ...state,
        ...{
          fetching: true,
          fetchingError: null,
          list: [],
        },
      };

    case FETCH_GALLERY_FAILURE:
      return {
        ...state,
        ...{
          fetching: false,
          fetchingError: action.payload.error,
        },
      };

    case FETCH_GALLERY_SUCCESS:
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
