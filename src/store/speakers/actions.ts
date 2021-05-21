import { Dispatch } from 'redux';
import { Speaker } from '../../models/speaker';
import { mergeId } from '../../utils/merge-id';
import { db } from '../../firebase';
import {
  FETCH_SPEAKERS,
  FETCH_SPEAKERS_FAILURE,
  FETCH_SPEAKERS_SUCCESS,
  SpeakerActions,
} from './types';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

const getSpeakers = async (): Promise<Speaker[]> => {
  const { docs } = await getDocs(
    query(collection(db, 'generatedSpeakers'), orderBy('order', 'asc'))
  );

  return docs.map<Speaker>(mergeId);
};

export const fetchSpeakersList = () => async (dispatch: Dispatch<SpeakerActions>) => {
  dispatch({
    type: FETCH_SPEAKERS,
  });

  try {
    dispatch({
      type: FETCH_SPEAKERS_SUCCESS,
      payload: await getSpeakers(),
    });
  } catch (error) {
    dispatch({
      type: FETCH_SPEAKERS_FAILURE,
      payload: error,
    });
  }
};
