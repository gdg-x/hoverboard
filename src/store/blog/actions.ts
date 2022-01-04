import { Initialized, Success } from '@abraham/remotedata';
import { orderBy } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { Post } from '../../models/post';
import { subscribeToCollection, Subscription } from '../../utils/firestore';
import {
  BlogActions,
  FETCH_BLOG_LIST,
  FETCH_BLOG_LIST_FAILURE,
  FETCH_BLOG_LIST_SUCCESS,
} from './types';

let subscription: Subscription = new Initialized();

export const unsubscribe = () => {
  if (subscription instanceof Success) {
    subscription.data();
  }
};

export const fetchBlogPosts = async (dispatch: Dispatch<BlogActions>) => {
  if (subscription instanceof Initialized) {
    subscription = subscribeToCollection(
      'blog',
      () => dispatch({ type: FETCH_BLOG_LIST }),
      (payload: Post[]) => dispatch({ type: FETCH_BLOG_LIST_SUCCESS, payload }),
      (payload: Error) => dispatch({ type: FETCH_BLOG_LIST_FAILURE, payload }),
      orderBy('published', 'desc')
    );
  }
};
