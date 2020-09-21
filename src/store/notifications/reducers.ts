import { Failure, Initialized, Success } from '@abraham/remotedata';
import { initialNotificationState, NotificationState } from './state';
import {
  NotificationActions,
  NOTIFICATIONS_FAILURE,
  NOTIFICATIONS_SUCCESS,
  REMOVE_NOTIFICATIONS,
} from './types';

export const notificationsReducer = (
  state = initialNotificationState,
  action: NotificationActions
): NotificationState => {
  switch (action.type) {
    case REMOVE_NOTIFICATIONS:
      return new Initialized();

    case NOTIFICATIONS_FAILURE:
      return new Failure(action.payload);

    case NOTIFICATIONS_SUCCESS:
      return new Success(action.payload);

    default:
      return state;
  }
};
