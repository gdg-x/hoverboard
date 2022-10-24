import { Day } from '../../models/day';

export const FETCH_SCHEDULE = 'FETCH_SCHEDULE';
export const FETCH_SCHEDULE_FAILURE = 'FETCH_SCHEDULE_FAILURE';
export const FETCH_SCHEDULE_SUCCESS = 'FETCH_SCHEDULE_SUCCESS';

interface FetchScheduleAction {
  type: typeof FETCH_SCHEDULE;
}

interface FetchScheduleFailureAction {
  type: typeof FETCH_SCHEDULE_FAILURE;
  payload: Error;
}

interface FetchScheduleSuccessAction {
  type: typeof FETCH_SCHEDULE_SUCCESS;
  payload: Day[];
}

export type ScheduleActions =
  | FetchScheduleAction
  | FetchScheduleFailureAction
  | FetchScheduleSuccessAction;
