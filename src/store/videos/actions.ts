import { Initialized, Success } from '@abraham/remotedata';
import { orderBy } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { Video } from '../../models/video';
import { subscribeToCollection, Subscription } from '../../utils/firestore';
import {
  FetchVideosActions,
  FETCH_VIDEOS,
  FETCH_VIDEOS_FAILURE,
  FETCH_VIDEOS_SUCCESS,
} from './types';

let subscription: Subscription = new Initialized();

export const unsubscribe = () => {
  if (subscription instanceof Success) {
    subscription.data();
  }
};

export const fetchVideos = async (dispatch: Dispatch<FetchVideosActions>) => {
  if (subscription instanceof Initialized) {
    subscription = subscribeToCollection(
      'videos',
      () => dispatch({ type: FETCH_VIDEOS }),
      (payload: Video[]) => dispatch({ type: FETCH_VIDEOS_SUCCESS, payload }),
      (payload: Error) => dispatch({ type: FETCH_VIDEOS_FAILURE, payload }),
      orderBy('order')
    );
  }
};
