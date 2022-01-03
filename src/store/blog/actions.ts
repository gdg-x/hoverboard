import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { db } from '../../firebase';
import { Post } from '../../models/post';
import { mergeDataAndId } from '../../utils/firestore';
import {
  BlogActions,
  FETCH_BLOG_LIST,
  FETCH_BLOG_LIST_FAILURE,
  FETCH_BLOG_LIST_SUCCESS,
} from './types';

const getPosts = async (): Promise<Post[]> => {
  const { docs } = await getDocs(query(collection(db, 'blog'), orderBy('published', 'desc')));

  return docs.map<Post>(mergeDataAndId);
};

export const fetchBlogPosts = async (dispatch: Dispatch<BlogActions>) => {
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
