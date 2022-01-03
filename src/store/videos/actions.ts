import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { db } from '../../firebase';
import { Video } from '../../models/video';
import { mergeDataAndId } from '../../utils/firestore';
import {
  FetchVideosActions,
  FETCH_VIDEOS,
  FETCH_VIDEOS_FAILURE,
  FETCH_VIDEOS_SUCCESS,
} from './types';

const getVideos = async (): Promise<Video[]> => {
  const { docs } = await getDocs(query(collection(db, 'videos'), orderBy('order', 'asc')));

  return docs.map<Video>(mergeDataAndId);
};

export const fetchVideos = async (dispatch: Dispatch<FetchVideosActions>) => {
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
