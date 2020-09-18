import { FirebaseError } from 'firebase';
import { Schedule } from '../../models/schedule';

export const FETCH_SCHEDULE = 'FETCH_SCHEDULE';
export const FETCH_SCHEDULE_FAILURE = 'FETCH_SCHEDULE_FAILURE';
export const FETCH_SCHEDULE_SUCCESS = 'FETCH_SCHEDULE_SUCCESS';

export type ScheduleState = Schedule[];

interface FetchScheduleAction {
  type: typeof FETCH_SCHEDULE;
}

interface FetchScheduleFailureAction {
  type: typeof FETCH_SCHEDULE_FAILURE;
  payload: {
    error: FirebaseError;
  };
}

interface FetchScheduleSuccessAction {
  type: typeof FETCH_SCHEDULE_SUCCESS;
  data: Schedule[];
}

export type ScheduleActionTypes =
  | FetchScheduleAction
  | FetchScheduleFailureAction
  | FetchScheduleSuccessAction;
