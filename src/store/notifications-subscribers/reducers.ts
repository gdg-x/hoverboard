import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { initialNotificationsSubscribersState, NotificationsSubscribersState } from './state';
import {
  SET_NOTIFICATION_SUBSCRIBERS,
  SET_NOTIFICATION_SUBSCRIBERS_FAILURE,
  SET_NOTIFICATION_SUBSCRIBERS_SUCCESS,
  NotificationSubscribersActions,
  RESET_NOTIFICATION_SUBSCRIBERS,
} from './types';

export const notificationsSubscribersReducer = (
  state = initialNotificationsSubscribersState,
  action: NotificationSubscribersActions
): NotificationsSubscribersState => {
  switch (action.type) {
    case SET_NOTIFICATION_SUBSCRIBERS:
      return new Pending();

    case RESET_NOTIFICATION_SUBSCRIBERS:
      return new Initialized();

    case SET_NOTIFICATION_SUBSCRIBERS_FAILURE:
      return new Failure(action.payload);

    case SET_NOTIFICATION_SUBSCRIBERS_SUCCESS:
      return new Success(action.payload);

    default:
      return state;
  }
};
