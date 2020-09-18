import { initialScheduleState } from './state';
import { FETCH_SCHEDULE_SUCCESS, ScheduleActionTypes } from './types';

export const scheduleReducer = (state = initialScheduleState, action: ScheduleActionTypes) => {
  switch (action.type) {
    case FETCH_SCHEDULE_SUCCESS:
      return action.data;
    default:
      return state;
  }
};
