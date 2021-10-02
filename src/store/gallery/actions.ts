import { Dispatch } from 'redux';
import { Photo } from '../../models/photo';
import { mergeId } from '../../utils/merge-id';
import { db } from '../db';
import {
  FETCH_GALLERY,
  FETCH_GALLERY_FAILURE,
  FETCH_GALLERY_SUCCESS,
  GalleryActions,
} from './types';

const getGalleries = async (): Promise<Photo[]> => {
  const { docs } = await db().collection('gallery').get();

  return docs.map<Photo>(mergeId);
};

export const fetchGallery = () => async (dispatch: Dispatch<GalleryActions>) => {
  dispatch({
    type: FETCH_GALLERY,
  });

  try {
    dispatch({
      type: FETCH_GALLERY_SUCCESS,
      payload: await getGalleries(),
    });
  } catch (error) {
    dispatch({
      type: FETCH_GALLERY_FAILURE,
      payload: error,
    });
  }
};
