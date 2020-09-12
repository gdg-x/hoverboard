import { FETCH_SCHEDULE_SUCCESS } from '../constants';
import { initialState } from '../initial-state';

export const scheduleReducer = (state = initialState.schedule, action) => {
  switch (action.type) {
    case FETCH_SCHEDULE_SUCCESS:
      return action.data;
    default:
      return state;
  }
};
