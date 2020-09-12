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
} from '../constants';
import { db } from '../db';

export const feedbackActions = {
  addComment: (data) => (dispatch) => {
    dispatch({
      type: SEND_FEEDBACK,
      payload: data,
    });

    db()
      .collection(`${data.collection}/${data.dbItem}/feedback`)
      .doc(data.userId)
      .set({
        contentRating: data.contentRating,
        styleRating: data.styleRating,
        comment: data.comment,
      })
      .then(() => {
        dispatch({
          type: SEND_FEEDBACK_SUCCESS,
          payload: data,
        });
      })
      .catch((error) => {
        dispatch({
          type: SEND_FEEDBACK_FAILURE,
          payload: { error },
        });
      });
  },
  checkPreviousFeedback: (data) => (dispatch) => {
    dispatch({
      type: FETCH_PREVIOUS_FEEDBACK,
      payload: data,
    });

    db()
      .collection(`${data.collection}/${data.dbItem}/feedback`)
      .doc(data.userId)
      .get()
      .then((snapshot) => {
        dispatch({
          type: FETCH_PREVIOUS_FEEDBACK_SUCCESS,
          payload: {
            collection: data.collection,
            dbItem: data.dbItem,
            previousFeedback: snapshot.data(),
          },
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_PREVIOUS_FEEDBACK_FAILURE,
          payload: { error },
        });
      });
  },
  deleteFeedback: (data) => (dispatch) => {
    dispatch({
      type: DELETE_FEEDBACK,
      payload: data,
    });

    db()
      .collection(`${data.collection}/${data.dbItem}/feedback`)
      .doc(data.userId)
      .delete()
      .then(() => {
        dispatch({
          type: DELETE_FEEDBACK_SUCCESS,
          payload: {
            collection: data.collection,
            dbItem: data.dbItem,
          },
        });
      })
      .catch((error) => {
        dispatch({
          type: DELETE_FEEDBACK_FAILURE,
          payload: { error },
        });
      });
  },
};
