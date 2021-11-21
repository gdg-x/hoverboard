import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { db } from '../../firebase';
import {
  DELETE_FEEDBACK,
  DELETE_FEEDBACK_FAILURE,
  DELETE_FEEDBACK_SUCCESS,
  Feedback,
  FeedbackActions,
  FeedbackData,
  FeedbackId,
  FETCH_PREVIOUS_FEEDBACK,
  FETCH_PREVIOUS_FEEDBACK_FAILURE,
  FETCH_PREVIOUS_FEEDBACK_SUCCESS,
  SEND_FEEDBACK,
  SEND_FEEDBACK_FAILURE,
  SEND_FEEDBACK_SUCCESS,
} from './types';

export const addComment = (data: Feedback) => async (dispatch: Dispatch<FeedbackActions>) => {
  dispatch({
    type: SEND_FEEDBACK,
    payload: data,
  });

  try {
    await setDoc(doc(db, 'sessions', data.sessionId, 'feedback'), {
      contentRating: data.contentRating,
      styleRating: data.styleRating,
      comment: data.comment,
    });

    dispatch({
      type: SEND_FEEDBACK_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: SEND_FEEDBACK_FAILURE,
      payload: { error },
    });
  }
};

export const checkPreviousFeedback =
  (feedbackId: FeedbackId) => async (dispatch: Dispatch<FeedbackActions>) => {
    dispatch({
      type: FETCH_PREVIOUS_FEEDBACK,
      payload: feedbackId,
    });

    try {
      const { data } = await getDoc(doc(db, 'sessions', feedbackId.sessionId, 'feedback'));

      dispatch({
        type: FETCH_PREVIOUS_FEEDBACK_SUCCESS,
        payload: {
          sessionId: feedbackId.sessionId,
          previousFeedback: data() as FeedbackData,
        },
      });
    } catch (error) {
      dispatch({
        type: FETCH_PREVIOUS_FEEDBACK_FAILURE,
        payload: { error },
      });
    }
  };

export const deleteFeedback = (data: FeedbackId) => async (dispatch: Dispatch<FeedbackActions>) => {
  dispatch({
    type: DELETE_FEEDBACK,
    payload: data,
  });

  try {
    await deleteDoc(doc(db, 'sessions', data.sessionId, 'feedback'));

    dispatch({
      type: DELETE_FEEDBACK_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: DELETE_FEEDBACK_FAILURE,
      payload: { error },
    });
  }
};
