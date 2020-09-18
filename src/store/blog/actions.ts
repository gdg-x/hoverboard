import { FirebaseError } from 'firebase';
import { Dispatch } from 'redux';
import { db } from '../db';
import {
  BlogActionTypes,
  FETCH_BLOG_LIST,
  FETCH_BLOG_LIST_FAILURE,
  FETCH_BLOG_LIST_SUCCESS,
} from './types';

export const fetchBlogList = () => (dispatch: Dispatch<BlogActionTypes>) => {
  dispatch({
    type: FETCH_BLOG_LIST,
  });

  db()
    .collection('blog')
    .orderBy('published', 'desc')
    .get()
    .then((snaps) => {
      const list = snaps.docs.map((snap) => Object.assign({}, snap.data(), { id: snap.id }));

      const obj = list.reduce((acc, curr) => Object.assign({}, acc, { [curr.id]: curr }), {});

      dispatch({
        type: FETCH_BLOG_LIST_SUCCESS,
        payload: {
          obj,
          list,
        },
      });
    })
    .catch((error: FirebaseError) => {
      dispatch({
        type: FETCH_BLOG_LIST_FAILURE,
        payload: { error },
      });
    });
};
