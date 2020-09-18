import { initialPreviousSpeakersState } from './state';
import {
  FETCH_PREVIOUS_SPEAKERS,
  FETCH_PREVIOUS_SPEAKERS_FAILURE,
  FETCH_PREVIOUS_SPEAKERS_SUCCESS,
  PreviousSpeakersActionTypes,
} from './types';

export const previousSpeakersReducer = (
  state = initialPreviousSpeakersState,
  action: PreviousSpeakersActionTypes
) => {
  switch (action.type) {
    case FETCH_PREVIOUS_SPEAKERS:
      return {
        ...state,
        ...{
          fetching: true,
          fetchingError: null,
          list: [],
          obj: {},
        },
      };

    case FETCH_PREVIOUS_SPEAKERS_FAILURE:
      return {
        ...state,
        ...{
          fetching: false,
          fetchingError: action.payload.error,
        },
      };

    case FETCH_PREVIOUS_SPEAKERS_SUCCESS:
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
