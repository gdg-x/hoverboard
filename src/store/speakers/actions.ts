import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { db } from '../../firebase';
import { SpeakerWithTags } from '../../models/speaker';
import { mergeDataAndId } from '../../utils/firestore';
import {
  FETCH_SPEAKERS,
  FETCH_SPEAKERS_FAILURE,
  FETCH_SPEAKERS_SUCCESS,
  SpeakerActions,
} from './types';

const getSpeakers = async (): Promise<SpeakerWithTags[]> => {
  const { docs } = await getDocs(
    query(collection(db, 'generatedSpeakers'), orderBy('order', 'asc'))
  );

  return docs.map<SpeakerWithTags>(mergeDataAndId);
};

export const fetchSpeakers = async (dispatch: Dispatch<SpeakerActions>) => {
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
