import {
  DELETE_FEEDBACK,
  DELETE_FEEDBACK_FAILURE,
  DELETE_FEEDBACK_SUCCESS,
  FETCH_PREVIOUS_FEEDBACK,
  FETCH_PREVIOUS_FEEDBACK_FAILURE,
  FETCH_PREVIOUS_FEEDBACK_SUCCESS,
  SEND_FEEDBACK,
  SEND_FEEDBACK_FAILURE,
  SEND_FEEDBACK_SUCCESS,
  WIPE_PREVIOUS_FEEDBACK,
} from '../constants';
import { initialState } from '../initial-state';

export const feedbackReducer = (state = initialState.feedback, action) => {
  switch (action.type) {
    case FETCH_PREVIOUS_FEEDBACK:
      return Object.assign({}, state, {
        fetching: true,
        fetchingError: null,
      });

    case FETCH_PREVIOUS_FEEDBACK_FAILURE:
      return Object.assign({}, state, {
        fetching: false,
        fetchingError: action.payload.error,
      });

    case FETCH_PREVIOUS_FEEDBACK_SUCCESS:
      return Object.assign({}, state, {
        fetching: false,
        [action.payload.collection]: Object.assign({}, state[action.payload.collection], {
          [action.payload.dbItem]: action.payload.previousFeedback,
        }),
      });

    case SEND_FEEDBACK:
      return Object.assign({}, state, {
        adding: true,
        addingError: null,
      });

    case SEND_FEEDBACK_FAILURE:
      return Object.assign({}, state, {
        adding: false,
        addingError: action.payload.error,
      });

    case SEND_FEEDBACK_SUCCESS:
      return Object.assign({}, state, {
        adding: false,
        [action.payload.collection]: Object.assign({}, state[action.payload.collection], {
          [action.payload.dbItem]: {
            contentRating: action.payload.contentRating,
            styleRating: action.payload.styleRating,
            comment: action.payload.comment,
          },
        }),
      });

    case DELETE_FEEDBACK:
      return Object.assign({}, state, {
        deleting: true,
        deletingError: null,
      });

    case DELETE_FEEDBACK_FAILURE:
      return Object.assign({}, state, {
        deleting: false,
        deletingError: action.payload.error,
      });

    case DELETE_FEEDBACK_SUCCESS:
      return Object.assign({}, state, {
        deleting: false,
        [action.payload.collection]: {
          [action.payload.dbItem]: null,
        },
      });

    case WIPE_PREVIOUS_FEEDBACK:
      return initialState.feedback;

    default:
      return state;
  }
};
