import { Dispatch } from 'redux';
import { db } from '../db';
import { SET_FILTERS } from '../filters/types';
import { FETCH_SESSIONS, FETCH_SESSIONS_FAILURE, FETCH_SESSIONS_SUCCESS } from './types';

export const fetchSessionsList = () => (dispatch: Dispatch) => {
  dispatch({
    type: FETCH_SESSIONS,
  });

  return new Promise((resolve, reject) => {
    db()
      .collection('generatedSessions')
      .get()
      .then((snaps) => {
        const list = [];
        const obj = {};
        const tagFilters = new Set();
        const complexityFilters = new Set();

        snaps.docs.forEach((doc) => {
          const session = Object.assign({}, doc.data());
          list.push(session);
          session.tags && session.tags.map((tag) => tagFilters.add(tag.trim()));
          session.complexity && complexityFilters.add(session.complexity.trim());
          obj[doc.id] = session;
        });

        const payload = {
          obj,
          list,
        };

        dispatch({
          type: FETCH_SESSIONS_SUCCESS,
          payload,
        });

        dispatch({
          type: SET_FILTERS,
          payload: {
            tags: [...tagFilters].sort(),
            complexity: [...complexityFilters],
          },
        });

        resolve(payload);
      })
      .catch((error) => {
        dispatch({
          type: FETCH_SESSIONS_FAILURE,
          payload: { error },
        });
        reject(error);
      });
  });
};
