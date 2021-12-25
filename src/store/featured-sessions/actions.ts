import { Success } from '@abraham/remotedata';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { store } from '..';
import { db } from '../../firebase';
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

const selectFeaturedSessions = (): FeaturedSessions => {
  const featuredSessions = store.getState().featuredSessions;
  if (featuredSessions instanceof Success) {
    return featuredSessions.data;
  } else {
    return {};
  }
};

export const buildFeaturedSessions = (sessionId: string, featured: boolean): FeaturedSessions => {
  const sessions = {
    ...selectFeaturedSessions(),
    [sessionId]: featured,
  };

  return sessions;
};

const getFeaturedSessions = async (userId: string): Promise<FeaturedSessions> => {
  const snapshot = await getDoc(doc(db, 'featuredSessions', userId));

  return snapshot.data() || {};
};

export const fetchUserFeaturedSessions =
  (userId: string) => async (dispatch: Dispatch<FeaturedSessionsActions>) => {
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
  await setDoc(doc(db, 'featuredSessions', userId), featuredSessions);
};

const cleanFeaturedSessions = (object: FeaturedSessions): FeaturedSessions => {
  const hasValue = ([_key, value]: [string, unknown]) => Boolean(value);
  return Object.fromEntries(Object.entries(object).filter(hasValue));
};

export const setUserFeaturedSessions =
  (userId: string, featuredSessions: FeaturedSessions) =>
  async (dispatch: Dispatch<FeaturedSessionsActions>) => {
    dispatch({
      type: SET_USER_FEATURED_SESSIONS,
    });

    try {
      const cleanedFeaturedSessions = cleanFeaturedSessions(featuredSessions);
      await setFeaturedSessions(userId, cleanedFeaturedSessions);
      dispatch({
        type: SET_USER_FEATURED_SESSIONS_SUCCESS,
        payload: cleanedFeaturedSessions,
      });
    } catch (error) {
      dispatch({
        type: SET_USER_FEATURED_SESSIONS_FAILURE,
        payload: error,
      });
    }
  };
