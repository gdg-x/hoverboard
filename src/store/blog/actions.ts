import { Dispatch } from 'redux';
import { Post } from '../../models/post';
import { mergeId } from '../../utils/merge-id';
import { db } from '../db';
import {
  BlogAction,
  FETCH_BLOG_LIST,
  FETCH_BLOG_LIST_FAILURE,
  FETCH_BLOG_LIST_SUCCESS,
} from './types';

const getPosts = async (): Promise<Post[]> => {
  const { docs } = await db().collection('blog').orderBy('published', 'desc').get();

  return docs.map<Post>(mergeId);
};

export const fetchBlogList = () => async (dispatch: Dispatch<BlogAction>) => {
  dispatch({
    type: FETCH_BLOG_LIST,
  });

  try {
    dispatch({
      type: FETCH_BLOG_LIST_SUCCESS,
      payload: await getPosts(),
    });
  } catch (error) {
    dispatch({
      type: FETCH_BLOG_LIST_FAILURE,
      payload: error,
    });
  }
};
