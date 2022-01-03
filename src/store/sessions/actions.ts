import { collection, getDocs, query } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { db } from '../../firebase';
import { Session } from '../../models/session';
import { mergeDataAndId } from '../../utils/firestore';
import {
  FETCH_SESSIONS,
  FETCH_SESSIONS_FAILURE,
  FETCH_SESSIONS_SUCCESS,
  SessionsActions,
} from './types';

const getSessions = async () => {
  const { docs } = await getDocs(query(collection(db, 'generatedSessions')));
  return docs.map<Session>(mergeDataAndId);
};

export const fetchSessions = () => async (dispatch: Dispatch<SessionsActions>) => {
  dispatch({
    type: FETCH_SESSIONS,
  });

  try {
    dispatch({
      type: FETCH_SESSIONS_SUCCESS,
      payload: await getSessions(),
    });
  } catch (error) {
    dispatch({
      type: FETCH_SESSIONS_FAILURE,
      payload: error,
    });
  }
};
