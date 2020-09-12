import { UPDATE_NOTIFICATIONS_STATUS } from '../constants';
import { initialState } from '../initial-state';

export const notificationsReducer = (state = initialState.notifications, action) => {
  switch (action.type) {
    case UPDATE_NOTIFICATIONS_STATUS:
      return Object.assign({}, state, {
        status: action.status,
        token: action.token,
      });
    default:
      return state;
  }
};
