import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { db } from '../../firebase';
import { PreviousSpeaker } from '../../models/previous-speaker';
import { mergeDataAndId } from '../../utils/firestore';
import {
  FETCH_PREVIOUS_SPEAKERS,
  FETCH_PREVIOUS_SPEAKERS_FAILURE,
  FETCH_PREVIOUS_SPEAKERS_SUCCESS,
  PreviousSpeakersActions,
} from './types';

const getPreviousSpeakers = async (): Promise<PreviousSpeaker[]> => {
  const { docs } = await getDocs(
    query(collection(db, 'previousSpeakers'), orderBy('order', 'asc'))
  );

  return docs.map<PreviousSpeaker>(mergeDataAndId).sort((speakerA, speakerB) => {
    return speakerA.name.localeCompare(speakerB.name);
  });
};

export const fetchPreviousSpeakers = () => async (dispatch: Dispatch<PreviousSpeakersActions>) => {
  dispatch({
    type: FETCH_PREVIOUS_SPEAKERS,
  });

  try {
    dispatch({
      type: FETCH_PREVIOUS_SPEAKERS_SUCCESS,
      payload: await getPreviousSpeakers(),
    });
  } catch (error) {
    dispatch({
      type: FETCH_PREVIOUS_SPEAKERS_FAILURE,
      payload: error,
    });
  }
};
