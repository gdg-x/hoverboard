import { PreviousSpeaker } from '../../models/previous-speaker';

export const FETCH_PREVIOUS_SPEAKERS = 'FETCH_PREVIOUS_SPEAKERS';
export const FETCH_PREVIOUS_SPEAKERS_FAILURE = 'FETCH_PREVIOUS_SPEAKERS_FAILURE';
export const FETCH_PREVIOUS_SPEAKERS_SUCCESS = 'FETCH_PREVIOUS_SPEAKERS_SUCCESS';

interface FetchPreviousSpeakersAction {
  type: typeof FETCH_PREVIOUS_SPEAKERS;
}

interface FetchPreviousSpeakersFailureAction {
  type: typeof FETCH_PREVIOUS_SPEAKERS_FAILURE;
  payload: Error;
}

interface FetchPreviousSpeakersSuccessAction {
  type: typeof FETCH_PREVIOUS_SPEAKERS_SUCCESS;
  payload: PreviousSpeaker[];
}

export type PreviousSpeakersActions =
  | FetchPreviousSpeakersAction
  | FetchPreviousSpeakersFailureAction
  | FetchPreviousSpeakersSuccessAction;
