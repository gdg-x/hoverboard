import { Dispatch } from 'redux';
import { Schedule } from '../../models/schedule';
import { db } from '../db';
import {
  FETCH_SCHEDULE,
  FETCH_SCHEDULE_FAILURE,
  FETCH_SCHEDULE_SUCCESS,
  ScheduleActions,
} from './types';

const getSchedule = async (): Promise<Schedule[]> => {
  const { docs } = await db().collection('generatedSchedule').get();

  return docs.map((doc) => doc.data()).sort((a, b) => a.date.localeCompare(b.date));
};

export const fetchSchedule = () => async (dispatch: Dispatch<ScheduleActions>) => {
  dispatch({
    type: FETCH_SCHEDULE,
  });

  try {
    dispatch({
      type: FETCH_SCHEDULE_SUCCESS,
      payload: await getSchedule(),
    });
  } catch (error) {
    dispatch({
      type: FETCH_SCHEDULE_FAILURE,
      payload: error,
    });
  }
};
