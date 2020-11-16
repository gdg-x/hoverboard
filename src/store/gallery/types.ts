import { Photo } from '../../models/photo';

export const FETCH_GALLERY = 'FETCH_GALLERY';
export const FETCH_GALLERY_FAILURE = 'FETCH_GALLERY_FAILURE';
export const FETCH_GALLERY_SUCCESS = 'FETCH_GALLERY_SUCCESS';

interface FetchGalleryAction {
  type: typeof FETCH_GALLERY;
}

interface FetchGalleryFailureAction {
  type: typeof FETCH_GALLERY_FAILURE;
  payload: Error;
}

interface FetchGallerySuccessAction {
  type: typeof FETCH_GALLERY_SUCCESS;
  payload: Photo[];
}

export type GalleryActions =
  | FetchGalleryAction
  | FetchGalleryFailureAction
  | FetchGallerySuccessAction;
