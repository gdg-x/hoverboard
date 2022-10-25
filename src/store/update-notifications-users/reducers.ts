import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { initialUpdateNotificationsUsersState, UpdateNotificationsUsersState } from './state';
import {
  UPDATE_NOTIFICATION_USERS,
  UPDATE_NOTIFICATION_USERS_FAILURE,
  UPDATE_NOTIFICATION_USERS_SUCCESS,
  UpdateNotificationsUsersActions,
  RESET_UPDATE_NOTIFICATIONS_USERS,
} from './types';

export const updateNotificationsUsersReducer = (
  state = initialUpdateNotificationsUsersState,
  action: UpdateNotificationsUsersActions
): UpdateNotificationsUsersState => {
  switch (action.type) {
    case UPDATE_NOTIFICATION_USERS:
      return new Pending();

    case RESET_UPDATE_NOTIFICATIONS_USERS:
      return new Initialized();

    case UPDATE_NOTIFICATION_USERS_FAILURE:
      return new Failure(action.payload);

    case UPDATE_NOTIFICATION_USERS_SUCCESS:
      return new Success(action.payload);

    default:
      return state;
  }
};
