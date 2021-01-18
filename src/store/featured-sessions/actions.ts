import { Dispatch } from 'redux';
import { db } from '../db';
import { FeaturedSessions } from './state';
import {
  FeaturedSessionsActions,
  FETCH_USER_FEATURED_SESSIONS,
  FETCH_USER_FEATURED_SESSIONS_FAILURE,
  FETCH_USER_FEATURED_SESSIONS_SUCCESS,
  SET_USER_FEATURED_SESSIONS,
  SET_USER_FEATURED_SESSIONS_FAILURE,
  SET_USER_FEATURED_SESSIONS_SUCCESS,
} from './types';

const getFeaturedSessions = async (userId: string): Promise<FeaturedSessions> => {
  const doc = await db().collection('featuredSessions').doc(userId).get();

  return doc.data() || {};
};

export const fetchUserFeaturedSessions = (userId: string) => async (
  dispatch: Dispatch<FeaturedSessionsActions>
) => {
  dispatch({
    type: FETCH_USER_FEATURED_SESSIONS,
  });

  try {
    dispatch({
      type: FETCH_USER_FEATURED_SESSIONS_SUCCESS,
      payload: await getFeaturedSessions(userId),
    });
  } catch (error) {
    dispatch({
      type: FETCH_USER_FEATURED_SESSIONS_FAILURE,
      payload: error,
    });
  }
};

const setFeaturedSessions = async (
  userId: string,
  featuredSessions: FeaturedSessions
): Promise<void> => {
  return db().collection('featuredSessions').doc(userId).set(featuredSessions);
};

export const setUserFeaturedSessions = (
  userId: string,
  featuredSessions: FeaturedSessions
) => async (dispatch: Dispatch<FeaturedSessionsActions>) => {
  dispatch({
    type: SET_USER_FEATURED_SESSIONS,
  });

  try {
    await setFeaturedSessions(userId, featuredSessions);
    dispatch({
      type: SET_USER_FEATURED_SESSIONS_SUCCESS,
      payload: featuredSessions,
    });
  } catch (error) {
    dispatch({
      type: SET_USER_FEATURED_SESSIONS_FAILURE,
      payload: error,
    });
  }
};
