import { Dispatch } from 'redux';
import { Speaker } from '../../models/speaker';
import { mergeId } from '../../utils/merge-id';
import { db } from '../db';
import {
  FETCH_SPEAKERS,
  FETCH_SPEAKERS_FAILURE,
  FETCH_SPEAKERS_SUCCESS,
  SpeakerActions,
} from './types';

const getSpeakers = async (): Promise<Speaker[]> => {
  const { docs } = await db().collection('generatedSpeakers').orderBy('order', 'asc').get();

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
