import { Initialized, Success } from '@abraham/remotedata';
import { orderBy } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { Photo } from '../../models/photo';
import { subscribeToCollection, Subscription } from '../../utils/firestore';
import {
  FETCH_GALLERY,
  FETCH_GALLERY_FAILURE,
  FETCH_GALLERY_SUCCESS,
  GalleryActions,
} from './types';

let subscription: Subscription = new Initialized();

export const unsubscribe = () => {
  if (subscription instanceof Success) {
    subscription.data();
  }
};

export const fetchGallery = async (dispatch: Dispatch<GalleryActions>) => {
  if (subscription instanceof Initialized) {
    subscription = subscribeToCollection(
      'gallery',
      () => dispatch({ type: FETCH_GALLERY }),
      (payload: Photo[]) => dispatch({ type: FETCH_GALLERY_SUCCESS, payload }),
      (payload: Error) => dispatch({ type: FETCH_GALLERY_FAILURE, payload }),
      orderBy('order')
    );
  }
};
