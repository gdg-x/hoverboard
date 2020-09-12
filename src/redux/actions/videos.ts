import { FETCH_VIDEOS, FETCH_VIDEOS_FAILURE, FETCH_VIDEOS_SUCCESS } from '../constants';

export const videosActions = {
  fetchVideos: () => (dispatch) => {
    dispatch({
      type: FETCH_VIDEOS,
    });

    return window.firebase
      .firestore()
      .collection('videos')
      .orderBy('order', 'asc')
      .get()
      .then((snaps) => {
        const list = snaps.docs.map((snap) => Object.assign({}, snap.data(), { id: snap.id }));

        dispatch({
          type: FETCH_VIDEOS_SUCCESS,
          payload: { list },
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_VIDEOS_FAILURE,
          payload: { error },
        });
      });
  },
};
