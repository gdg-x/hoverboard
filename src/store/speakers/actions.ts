import { Initialized, Success } from '@abraham/remotedata';
import { Dispatch } from 'redux';
import { SpeakerWithTags } from '../../models/speaker';
import { subscribeToCollection, Subscription } from '../../utils/firestore';
import {
  FETCH_SPEAKERS,
  FETCH_SPEAKERS_FAILURE,
  FETCH_SPEAKERS_SUCCESS,
  SpeakerActions,
} from './types';

let subscription: Subscription = new Initialized();

export const unsubscribe = () => {
  if (subscription instanceof Success) {
    subscription.data();
  }
};

export const fetchSpeakers = async (dispatch: Dispatch<SpeakerActions>) => {
  if (subscription instanceof Initialized) {
    subscription = subscribeToCollection(
      'generatedSpeakers',
      () => dispatch({ type: FETCH_SPEAKERS }),
      (payload: SpeakerWithTags[]) => dispatch({ type: FETCH_SPEAKERS_SUCCESS, payload }),
      (payload: Error) => dispatch({ type: FETCH_SPEAKERS_FAILURE, payload })
    );
  }
};
