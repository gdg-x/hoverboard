import { Failure, Pending, Success } from '@abraham/remotedata';
import { initialNotificationsSubscribersState, NotificationsSubscribersState } from './state';
import {
  FETCH_NOTIFICATIONS_SUBSCRIBERS,
  FETCH_NOTIFICATIONS_SUBSCRIBERS_FAILURE,
  FETCH_NOTIFICATIONS_SUBSCRIBERS_SUCCESS,
  NotificationsSubscribersActions,
} from './types';

export const notificationsSubscribersReducer = (
  state = initialNotificationsSubscribersState,
  action: NotificationsSubscribersActions
): NotificationsSubscribersState => {
  switch (action.type) {
    case FETCH_NOTIFICATIONS_SUBSCRIBERS:
      return new Pending();

    case FETCH_NOTIFICATIONS_SUBSCRIBERS_FAILURE:
      return new Failure(action.payload);

    case FETCH_NOTIFICATIONS_SUBSCRIBERS_SUCCESS:
      return new Success(action.payload);

    default:
      return state;
  }
};
