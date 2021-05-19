import { collection, getDocs, query } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { db } from '../../firebase';
import { Session } from '../../models/session';
import { mergeId } from '../../utils/merge-id';
import { FiltersActions, SET_FILTERS } from '../filters/types';
import {
  FETCH_SESSIONS,
  FETCH_SESSIONS_FAILURE,
  FETCH_SESSIONS_SUCCESS,
  SessionsActions,
} from './types';

const getSessions = async () => {
  const { docs } = await getDocs(query(collection(db, 'generatedSessions')));
  const tagFilters = new Set<string>();
  const complexityFilters = new Set<string>();
  const sessions = docs.map<Session>(mergeId);

  sessions.forEach((session) => {
    (session.tags || []).map((tag) => tagFilters.add(tag.trim()));
    session.complexity && complexityFilters.add(session.complexity.trim());
  });

  return {
    complexityFilters,
    sessions,
    tagFilters,
  };
};

export const fetchSessions = () => async (dispatch: Dispatch<SessionsActions | FiltersActions>) => {
  dispatch({
    type: FETCH_SESSIONS,
  });

  try {
    const { complexityFilters, sessions, tagFilters } = await getSessions();

    dispatch({
      type: FETCH_SESSIONS_SUCCESS,
      payload: sessions,
    });
    dispatch({
      type: SET_FILTERS,
      payload: {
        tags: [...tagFilters].sort(),
        complexity: [...complexityFilters],
      },
    });
  } catch (error) {
    dispatch({
      type: FETCH_SESSIONS_FAILURE,
      payload: error,
    });
  }
};
