import { Failure, Pending, Success } from '@abraham/remotedata';
import { initialPreviousSpeakersState, PreviousSpeakersState } from './state';
import {
  FETCH_PREVIOUS_SPEAKERS,
  FETCH_PREVIOUS_SPEAKERS_FAILURE,
  FETCH_PREVIOUS_SPEAKERS_SUCCESS,
  PreviousSpeakersActions,
} from './types';

export const previousSpeakersReducer = (
  state = initialPreviousSpeakersState,
  action: PreviousSpeakersActions
): PreviousSpeakersState => {
  switch (action.type) {
    case FETCH_PREVIOUS_SPEAKERS:
      return new Pending();

    case FETCH_PREVIOUS_SPEAKERS_FAILURE:
      return new Failure(action.payload);

    case FETCH_PREVIOUS_SPEAKERS_SUCCESS:
      return new Success(action.payload);

    default:
      return state;
  }
};
