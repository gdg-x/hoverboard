import {
  FETCH_SESSIONS,
  FETCH_SESSIONS_FAILURE,
  FETCH_SESSIONS_SUCCESS,
  FETCH_USER_FEATURED_SESSIONS,
  FETCH_USER_FEATURED_SESSIONS_FAILURE,
  FETCH_USER_FEATURED_SESSIONS_SUCCESS,
  SET_FILTERS,
  SET_USER_FEATURED_SESSIONS,
  SET_USER_FEATURED_SESSIONS_FAILURE,
  SET_USER_FEATURED_SESSIONS_SUCCESS,
} from '../constants';
import { db } from '../db';

export const sessionsActions = {
  fetchList: () => (dispatch) => {
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
          const objBySpeaker = {};
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
            objBySpeaker,
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
  },

  fetchUserFeaturedSessions: (userId) => (dispatch) => {
    dispatch({
      type: FETCH_USER_FEATURED_SESSIONS,
      payload: { userId },
    });

    db()
      .collection('featuredSessions')
      .doc(userId)
      .get()
      .then((doc) => {
        dispatch({
          type: FETCH_USER_FEATURED_SESSIONS_SUCCESS,
          payload: {
            featuredSessions: doc.exists ? doc.data() : {},
          },
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_USER_FEATURED_SESSIONS_FAILURE,
          payload: { error },
        });
      });
  },

  setUserFeaturedSessions: (userId, featuredSessions) => (dispatch) => {
    dispatch({
      type: SET_USER_FEATURED_SESSIONS,
      payload: { userId, featuredSessions },
    });

    db()
      .collection('featuredSessions')
      .doc(userId)
      .set(featuredSessions)
      .then(() => {
        dispatch({
          type: SET_USER_FEATURED_SESSIONS_SUCCESS,
          payload: { featuredSessions },
        });
      })
      .catch((error) => {
        dispatch({
          type: SET_USER_FEATURED_SESSIONS_FAILURE,
          payload: { error },
        });
      });
  },
};
