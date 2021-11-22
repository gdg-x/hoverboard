import { initialNotificationState } from './state';
import { NotificationActionTypes, UPDATE_NOTIFICATIONS_STATUS } from './types';

export const notificationsReducer = (
  state = initialNotificationState,
  action: NotificationActionTypes
) => {
  switch (action.type) {
    case UPDATE_NOTIFICATIONS_STATUS:
      return {
        ...state,
        ...{
          status: action.status,
          token: action.token,
        },
      };
    default:
      return state;
  }
};
