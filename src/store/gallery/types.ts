import { FirebaseError } from 'firebase';

export const FETCH_GALLERY = 'FETCH_GALLERY';
export const FETCH_GALLERY_FAILURE = 'FETCH_GALLERY_FAILURE';
export const FETCH_GALLERY_SUCCESS = 'FETCH_GALLERY_SUCCESS';

export interface Gallery {
  id: string;
  url: string;
  order: string;
}

export interface GalleryState {
  fetching: boolean;
  fetchingError?: FirebaseError;
  list: Gallery[];
}

interface FetchGalleryAction {
  type: typeof FETCH_GALLERY;
}

interface FetchGalleryFailureAction {
  type: typeof FETCH_GALLERY_FAILURE;
  payload: {
    error: FirebaseError;
  };
}

interface FetchGallerySuccessAction {
  type: typeof FETCH_GALLERY_SUCCESS;
  payload: {
    list: Gallery[];
  };
}

export type GalleryActionTypes =
  | FetchGalleryAction
  | FetchGalleryFailureAction
  | FetchGallerySuccessAction;
