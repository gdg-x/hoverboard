import { collection, getDocs, query } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { db } from '../../firebase';
import { Day } from '../../models/day';
import {
  FETCH_SCHEDULE,
  FETCH_SCHEDULE_FAILURE,
  FETCH_SCHEDULE_SUCCESS,
  ScheduleActions,
} from './types';

const getSchedule = async (): Promise<Day[]> => {
  const { docs } = await getDocs(query(collection(db, 'generatedSchedule')));

  return docs.map<Day>((doc) => doc.data() as Day).sort((a, b) => a.date.localeCompare(b.date));
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
