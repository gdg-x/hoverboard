import { Failure, Pending, Success } from '@abraham/remotedata';
import { initialScheduleState, ScheduleState } from './state';
import {
  FETCH_SCHEDULE,
  FETCH_SCHEDULE_FAILURE,
  FETCH_SCHEDULE_SUCCESS,
  ScheduleActions,
} from './types';

export const scheduleReducer = (
  state = initialScheduleState,
  action: ScheduleActions
): ScheduleState => {
  switch (action.type) {
    case FETCH_SCHEDULE:
      return new Pending();

    case FETCH_SCHEDULE_SUCCESS:
      return new Success(action.payload);

    case FETCH_SCHEDULE_FAILURE:
      return new Failure(action.payload);

    default:
      return state;
  }
};
