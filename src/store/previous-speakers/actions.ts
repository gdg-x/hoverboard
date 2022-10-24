import { Initialized, Success } from '@abraham/remotedata';
import { Dispatch } from 'redux';
import { PreviousSpeaker } from '../../models/previous-speaker';
import { subscribeToCollection, Subscription } from '../../utils/firestore';
import {
  FETCH_PREVIOUS_SPEAKERS,
  FETCH_PREVIOUS_SPEAKERS_FAILURE,
  FETCH_PREVIOUS_SPEAKERS_SUCCESS,
  PreviousSpeakersActions,
} from './types';

let subscription: Subscription = new Initialized();

export const unsubscribe = () => {
  if (subscription instanceof Success) {
    subscription.data();
  }
};

export const fetchPreviousSpeakers = async (dispatch: Dispatch<PreviousSpeakersActions>) => {
  if (subscription instanceof Initialized) {
    subscription = subscribeToCollection(
      'previousSpeakers',
      () => dispatch({ type: FETCH_PREVIOUS_SPEAKERS }),
      (payload: PreviousSpeaker[]) => dispatch({ type: FETCH_PREVIOUS_SPEAKERS_SUCCESS, payload }),
      (payload: Error) => dispatch({ type: FETCH_PREVIOUS_SPEAKERS_FAILURE, payload })
    );
  }
};
