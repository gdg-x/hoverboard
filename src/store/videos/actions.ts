import { Dispatch } from 'redux';
import { Video } from '../../models/video';
import { mergeId } from '../../utils/merge-id';
import { db } from '../db';
import {
  FetchVideosActions,
  FETCH_VIDEOS,
  FETCH_VIDEOS_FAILURE,
  FETCH_VIDEOS_SUCCESS,
} from './types';

const getVideos = async (): Promise<Video[]> => {
  const { docs } = await db().collection('videos').orderBy('order', 'asc').get();

  return docs.map<Video>(mergeId);
};

export const fetchVideos = () => async (dispatch: Dispatch<FetchVideosActions>) => {
  dispatch({
    type: FETCH_VIDEOS,
  });

  try {
    dispatch({
      type: FETCH_VIDEOS_SUCCESS,
      payload: await getVideos(),
    });
  } catch (error) {
    dispatch({
      type: FETCH_VIDEOS_FAILURE,
      payload: error,
    });
  }
};
