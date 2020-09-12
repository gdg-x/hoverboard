import { FETCH_GALLERY, FETCH_GALLERY_FAILURE, FETCH_GALLERY_SUCCESS } from '../constants';
import { db } from '../db';

export const galleryActions = {
  fetchGallery: () => (dispatch) => {
    dispatch({
      type: FETCH_GALLERY,
    });

    return db()
      .collection('gallery')
      .get()
      .then((snaps) => {
        const list = snaps.docs.map((snap) => Object.assign({}, snap.data(), { id: snap.id }));

        dispatch({
          type: FETCH_GALLERY_SUCCESS,
          payload: { list },
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_GALLERY_FAILURE,
          payload: { error },
        });
      });
  },
};
