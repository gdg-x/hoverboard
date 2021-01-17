import { Speaker } from '../../models/speaker';

export const FETCH_SPEAKERS = 'FETCH_SPEAKERS';
export const FETCH_SPEAKERS_FAILURE = 'FETCH_SPEAKERS_FAILURE';
export const FETCH_SPEAKERS_SUCCESS = 'FETCH_SPEAKERS_SUCCESS';

interface FetchSpeakersAction {
  type: typeof FETCH_SPEAKERS;
}

interface FetchSpeakersFailureAction {
  type: typeof FETCH_SPEAKERS_FAILURE;
  payload: Error;
}

interface FetchSpeakersSuccessAction {
  type: typeof FETCH_SPEAKERS_SUCCESS;
  payload: Speaker[];
}

export type SpeakerActions =
  | FetchSpeakersAction
  | FetchSpeakersFailureAction
  | FetchSpeakersSuccessAction;
