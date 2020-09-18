import { Dispatch } from 'redux';
import { db } from '../db';
import { FETCH_SCHEDULE, FETCH_SCHEDULE_FAILURE, FETCH_SCHEDULE_SUCCESS } from './types';

export const fetchSchedule = () => (dispatch: Dispatch) => {
  dispatch({
    type: FETCH_SCHEDULE,
  });

  return db()
    .collection('generatedSchedule')
    .get()
    .then((snaps) => {
      const scheduleDays = snaps.docs.map((snap) => snap.data());
      dispatch({
        type: FETCH_SCHEDULE_SUCCESS,
        data: scheduleDays.sort((a, b) => a.date.localeCompare(b.date)),
      });
    })
    .catch((error) => {
      dispatch({
        type: FETCH_SCHEDULE_FAILURE,
        payload: { error },
      });
    });
};
