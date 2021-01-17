import { Dispatch } from 'redux';
import { Speaker } from '../../models/speaker';
import { mergeId } from '../../utils/merge-id';
import { db } from '../db';
import {
  FETCH_PREVIOUS_SPEAKERS,
  FETCH_PREVIOUS_SPEAKERS_FAILURE,
  FETCH_PREVIOUS_SPEAKERS_SUCCESS,
  PreviousSpeakersActions,
} from './types';

const getPreviousSpeakers = async (): Promise<Speaker[]> => {
  const { docs } = await db().collection('previousSpeakers').orderBy('order', 'asc').get();

  return docs.map<Speaker>(mergeId);
};

export const fetchPreviousSpeakersList = () => async (
  dispatch: Dispatch<PreviousSpeakersActions>
) => {
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
