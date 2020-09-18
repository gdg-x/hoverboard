import { FirebaseError } from 'firebase';
import { Speaker } from '../../models/speaker';

export const FETCH_SPEAKERS = 'FETCH_SPEAKERS';
export const FETCH_SPEAKERS_FAILURE = 'FETCH_SPEAKERS_FAILURE';
export const FETCH_SPEAKERS_SUCCESS = 'FETCH_SPEAKERS_SUCCESS';

export interface SpeakersState {
  fetching: boolean;
  fetchingError?: FirebaseError;
  list: Speaker[];
  obj: {
    [speakerId: string]: Speaker;
  };
}

interface FetchSpeakersAction {
  type: typeof FETCH_SPEAKERS;
}

interface FetchSpeakersFailureAction {
  type: typeof FETCH_SPEAKERS_FAILURE;
  payload: {
    error: FirebaseError;
  };
}

interface FetchSpeakersSuccessAction {
  type: typeof FETCH_SPEAKERS_SUCCESS;
  payload: {
    list: Speaker[];
    obj: {
      [speakerId: string]: Speaker;
    };
  };
}

export type SpeakerActionTypes =
  | FetchSpeakersAction
  | FetchSpeakersFailureAction
  | FetchSpeakersSuccessAction;
