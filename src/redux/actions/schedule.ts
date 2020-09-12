import { FETCH_SCHEDULE, FETCH_SCHEDULE_FAILURE, FETCH_SCHEDULE_SUCCESS } from '../constants';
import { db } from '../db';

export const scheduleActions = {
  fetchSchedule: () => (dispatch) => {
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
  },
};
