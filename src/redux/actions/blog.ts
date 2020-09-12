import { FETCH_BLOG_LIST, FETCH_BLOG_LIST_FAILURE, FETCH_BLOG_LIST_SUCCESS } from '../constants';
import { db } from '../db';

export const blogActions = {
  fetchList: () => (dispatch) => {
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
      .catch((error) => {
        dispatch({
          type: FETCH_BLOG_LIST_FAILURE,
          payload: { error },
        });
      });
  },
};
