import { Failure, Pending, Success } from '@abraham/remotedata';
import { initialSpeakersState, SpeakersState } from './state';
import {
  FETCH_SPEAKERS,
  FETCH_SPEAKERS_FAILURE,
  FETCH_SPEAKERS_SUCCESS,
  SpeakerActions,
} from './types';

export const speakersReducer = (
  state = initialSpeakersState,
  action: SpeakerActions
): SpeakersState => {
  switch (action.type) {
    case FETCH_SPEAKERS:
      return new Pending();

    case FETCH_SPEAKERS_FAILURE:
      return new Failure(action.payload);

    case FETCH_SPEAKERS_SUCCESS:
      return new Success(action.payload);

    default:
      return state;
  }
};
