import { Dispatch } from 'redux';
import { db } from '../db';
import {
  FeaturedSessions,
  FETCH_USER_FEATURED_SESSIONS,
  FETCH_USER_FEATURED_SESSIONS_FAILURE,
  FETCH_USER_FEATURED_SESSIONS_SUCCESS,
  SET_USER_FEATURED_SESSIONS,
  SET_USER_FEATURED_SESSIONS_FAILURE,
  SET_USER_FEATURED_SESSIONS_SUCCESS,
} from './types';

export const fetchUserFeaturedSessions = (userId: string) => (dispatch: Dispatch) => {
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
};

export const setUserFeaturedSessions = (userId: string, featuredSessions: FeaturedSessions) => (
  dispatch: Dispatch
) => {
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
};
