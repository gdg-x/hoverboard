import { Speaker } from '../../models/speaker';

export const FETCH_PREVIOUS_SPEAKERS = 'FETCH_PREVIOUS_SPEAKERS';
export const FETCH_PREVIOUS_SPEAKERS_FAILURE = 'FETCH_PREVIOUS_SPEAKERS_FAILURE';
export const FETCH_PREVIOUS_SPEAKERS_SUCCESS = 'FETCH_PREVIOUS_SPEAKERS_SUCCESS';

export interface PreviousSpeakersState {
  fetching: boolean;
  fetchingError: Error;
  list: Speaker[];
  obj: {
    [speakerId: string]: Speaker;
  };
}

interface FetchPreviousSpeakersAction {
  type: typeof FETCH_PREVIOUS_SPEAKERS;
}

interface FetchPreviousSpeakersFailureAction {
  type: typeof FETCH_PREVIOUS_SPEAKERS_FAILURE;
  payload: {
    error: Error;
  };
}

interface FetchPreviousSpeakersSuccessAction {
  type: typeof FETCH_PREVIOUS_SPEAKERS_SUCCESS;
  payload: {
    list: Speaker[];
    obj: {
      [speakerId: string]: Speaker;
    };
  };
}

export type PreviousSpeakersActionTypes =
  | FetchPreviousSpeakersAction
  | FetchPreviousSpeakersFailureAction
  | FetchPreviousSpeakersSuccessAction;
