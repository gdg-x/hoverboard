import {
  FETCH_PREVIOUS_SPEAKERS,
  FETCH_PREVIOUS_SPEAKERS_FAILURE,
  FETCH_PREVIOUS_SPEAKERS_SUCCESS,
} from '../constants';
import { db } from '../db';

export const previousSpeakersActions = {
  fetchList: () => (dispatch) => {
    dispatch({
      type: FETCH_PREVIOUS_SPEAKERS,
    });

    db()
      .collection('previousSpeakers')
      .orderBy('order', 'asc')
      .get()
      .then((snaps) => {
        const list = snaps.docs.map((snap) => Object.assign({}, snap.data(), { id: snap.id }));

        const obj = list.reduce((acc, curr) => Object.assign({}, acc, { [curr.id]: curr }), {});

        dispatch({
          type: FETCH_PREVIOUS_SPEAKERS_SUCCESS,
          payload: {
            obj,
            list,
          },
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_PREVIOUS_SPEAKERS_FAILURE,
          payload: { error },
        });
      });
  },
};
