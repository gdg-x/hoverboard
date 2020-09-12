import { FETCH_SPEAKERS, FETCH_SPEAKERS_FAILURE, FETCH_SPEAKERS_SUCCESS } from '../constants';
import { initialState } from '../initial-state';

export const speakersReducer = (state = initialState.speakers, action) => {
  switch (action.type) {
    case FETCH_SPEAKERS:
      return Object.assign({}, state, {
        fetching: true,
        fetchingError: null,
        list: [],
        obj: {},
      });

    case FETCH_SPEAKERS_FAILURE:
      return Object.assign({}, state, {
        fetching: false,
        fetchingError: action.payload.error,
      });

    case FETCH_SPEAKERS_SUCCESS:
      return Object.assign({}, state, {
        fetching: false,
        list: action.payload.list,
        obj: action.payload.obj,
      });

    default:
      return state;
  }
};
