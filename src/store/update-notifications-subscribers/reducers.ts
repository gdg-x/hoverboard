import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import {
  initialUpdateNotificationsSubscribersState,
  UpdateNotificationsSubscribersState,
} from './state';
import {
  UPDATE_NOTIFICATION_SUBSCRIBERS,
  UPDATE_NOTIFICATION_SUBSCRIBERS_FAILURE,
  UPDATE_NOTIFICATION_SUBSCRIBERS_SUCCESS,
  UpdateNotificationsSubscribersActions,
  RESET_UPDATE_NOTIFICATIONS_SUBSCRIBERS,
} from './types';

export const updateNotificationsSubscribersReducer = (
  state = initialUpdateNotificationsSubscribersState,
  action: UpdateNotificationsSubscribersActions
): UpdateNotificationsSubscribersState => {
  switch (action.type) {
    case UPDATE_NOTIFICATION_SUBSCRIBERS:
      return new Pending();

    case RESET_UPDATE_NOTIFICATIONS_SUBSCRIBERS:
      return new Initialized();

    case UPDATE_NOTIFICATION_SUBSCRIBERS_FAILURE:
      return new Failure(action.payload);

    case UPDATE_NOTIFICATION_SUBSCRIBERS_SUCCESS:
      return new Success(action.payload);

    default:
      return state;
  }
};
