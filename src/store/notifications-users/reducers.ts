import { Failure, Pending, Success } from '@abraham/remotedata';
import { initialNotificationsUsersState, NotificationsUsersState } from './state';
import {
  FETCH_NOTIFICATIONS_USERS,
  FETCH_NOTIFICATIONS_USERS_FAILURE,
  FETCH_NOTIFICATIONS_USERS_SUCCESS,
  NotificationsUsersActions,
} from './types';

export const notificationsUsersReducer = (
  state = initialNotificationsUsersState,
  action: NotificationsUsersActions
): NotificationsUsersState => {
  switch (action.type) {
    case FETCH_NOTIFICATIONS_USERS:
      return new Pending();

    case FETCH_NOTIFICATIONS_USERS_FAILURE:
      return new Failure(action.payload);

    case FETCH_NOTIFICATIONS_USERS_SUCCESS:
      return new Success(action.payload);

    default:
      return state;
  }
};
