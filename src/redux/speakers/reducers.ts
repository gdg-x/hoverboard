import { initialSpeakersState } from './state';
import {
  FETCH_SPEAKERS,
  FETCH_SPEAKERS_FAILURE,
  FETCH_SPEAKERS_SUCCESS,
  SpeakerActionTypes,
} from './types';

export const speakersReducer = (state = initialSpeakersState, action: SpeakerActionTypes) => {
  switch (action.type) {
    case FETCH_SPEAKERS:
      return {
        ...state,
        ...{
          fetching: true,
          fetchingError: null,
          list: [],
          obj: {},
        },
      };

    case FETCH_SPEAKERS_FAILURE:
      return {
        ...state,
        ...{
          fetching: false,
          fetchingError: action.payload.error,
        },
      };

    case FETCH_SPEAKERS_SUCCESS:
      return {
        ...state,
        ...{
          fetching: false,
          list: action.payload.list,
          obj: action.payload.obj,
        },
      };

    default:
      return state;
  }
};
