import { UserTokens } from './state';

export const FETCH_NOTIFICATIONS_USERS = 'FETCH_NOTIFICATIONS_USERS';
export const FETCH_NOTIFICATIONS_USERS_FAILURE = 'FETCH_NOTIFICATIONS_USERS_FAILURE';
export const FETCH_NOTIFICATIONS_USERS_SUCCESS = 'FETCH_NOTIFICATIONS_USERS_SUCCESS';

interface FetchNotificationUsersAction {
  type: typeof FETCH_NOTIFICATIONS_USERS;
}

interface FetchNotificationUsersFailureAction {
  type: typeof FETCH_NOTIFICATIONS_USERS_FAILURE;
  payload: Error;
}

interface FetchNotificationUsersSuccessAction {
  type: typeof FETCH_NOTIFICATIONS_USERS_SUCCESS;
  payload: UserTokens;
}

export type NotificationsUsersActions =
  | FetchNotificationUsersAction
  | FetchNotificationUsersFailureAction
  | FetchNotificationUsersSuccessAction;
