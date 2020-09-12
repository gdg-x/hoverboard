import { FETCH_GALLERY, FETCH_GALLERY_FAILURE, FETCH_GALLERY_SUCCESS } from '../constants';
import { initialState } from '../initial-state';

export const galleryReducer = (state = initialState.gallery, action) => {
  switch (action.type) {
    case FETCH_GALLERY:
      return Object.assign({}, state, {
        fetching: true,
        fetchingError: null,
        list: [],
      });

    case FETCH_GALLERY_FAILURE:
      return Object.assign({}, state, {
        fetching: false,
        fetchingError: action.payload.error,
      });

    case FETCH_GALLERY_SUCCESS:
      return Object.assign({}, state, {
        fetching: false,
        list: action.payload.list,
      });

    default:
      return state;
  }
};
