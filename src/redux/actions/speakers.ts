import { TempAny } from '../../temp-any';
import { FETCH_SPEAKERS, FETCH_SPEAKERS_FAILURE, FETCH_SPEAKERS_SUCCESS } from '../constants';
import { db } from '../db';

export const speakersActions = {
  fetchList: () => (dispatch) => {
    dispatch({
      type: FETCH_SPEAKERS,
    });

    const speakersPromise = new Promise((resolve, reject) => {
      db()
        .collection('generatedSpeakers')
        .orderBy('order', 'asc')
        .get()
        .then((snaps) => {
          resolve(snaps.docs.map((snap) => Object.assign({}, snap.data())));
        })
        .catch(reject);
    });

    return Promise.all([speakersPromise])
      .then(([speakers]: TempAny[][]) => {
        dispatch({
          type: FETCH_SPEAKERS_SUCCESS,
          payload: {
            obj: speakers.reduce((acc, curr) => Object.assign({}, acc, { [curr.id]: curr }), {}),
            list: speakers,
          },
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_SPEAKERS_FAILURE,
          payload: { error },
        });
      });
  },
};
