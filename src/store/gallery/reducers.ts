import { Failure, Pending, Success } from '@abraham/remotedata';
import { GalleryState, initialGalleryState } from './state';
import {
  FETCH_GALLERY,
  FETCH_GALLERY_FAILURE,
  FETCH_GALLERY_SUCCESS,
  GalleryActions,
} from './types';

export const galleryReducer = (
  state = initialGalleryState,
  action: GalleryActions
): GalleryState => {
  switch (action.type) {
    case FETCH_GALLERY:
      return new Pending();

    case FETCH_GALLERY_FAILURE:
      return new Failure(action.payload);

    case FETCH_GALLERY_SUCCESS:
      return new Success(action.payload);

    default:
      return state;
  }
};
