import { initialFeedbackState } from './state';
import {
  DELETE_FEEDBACK,
  DELETE_FEEDBACK_FAILURE,
  DELETE_FEEDBACK_SUCCESS,
  FeedbackActionTypes,
  FETCH_PREVIOUS_FEEDBACK,
  FETCH_PREVIOUS_FEEDBACK_FAILURE,
  FETCH_PREVIOUS_FEEDBACK_SUCCESS,
  SEND_FEEDBACK,
  SEND_FEEDBACK_FAILURE,
  SEND_FEEDBACK_SUCCESS,
  WIPE_PREVIOUS_FEEDBACK,
} from './types';

export const feedbackReducer = (state = initialFeedbackState, action: FeedbackActionTypes) => {
  switch (action.type) {
    case FETCH_PREVIOUS_FEEDBACK:
      return {
        ...state,
        ...{
          fetching: true,
          fetchingError: null,
        },
      };

    case FETCH_PREVIOUS_FEEDBACK_FAILURE:
      return {
        ...state,
        ...{
          fetching: false,
          fetchingError: action.payload.error,
        },
      };

    case FETCH_PREVIOUS_FEEDBACK_SUCCESS:
      return {
        ...state,
        ...{
          fetching: false,
          [action.payload.collection]: {
            ...state[action.payload.collection],
            ...{
              [action.payload.dbItem]: action.payload.previousFeedback,
            },
          },
        },
      };

    case SEND_FEEDBACK:
      return {
        ...state,
        ...{
          adding: true,
          addingError: null,
        },
      };

    case SEND_FEEDBACK_FAILURE:
      return {
        ...state,
        ...{
          adding: false,
          addingError: action.payload.error,
        },
      };

    case SEND_FEEDBACK_SUCCESS:
      return {
        ...state,
        ...{
          adding: false,
          [action.payload.collection]: {
            ...state[action.payload.collection],
            ...{
              [action.payload.dbItem]: {
                contentRating: action.payload.contentRating,
                styleRating: action.payload.styleRating,
                comment: action.payload.comment,
              },
            },
          },
        },
      };

    case DELETE_FEEDBACK:
      return {
        ...state,
        ...{
          deleting: true,
          deletingError: null,
        },
      };

    case DELETE_FEEDBACK_FAILURE:
      return {
        ...state,
        ...{
          deleting: false,
          deletingError: action.payload.error,
        },
      };

    case DELETE_FEEDBACK_SUCCESS:
      return {
        ...state,
        ...{
          deleting: false,
          [action.payload.collection]: {
            [action.payload.dbItem]: null,
          },
        },
      };

    case WIPE_PREVIOUS_FEEDBACK:
      return initialFeedbackState;

    default:
      return state;
  }
};
