export const RESET_UPDATE_NOTIFICATIONS_USERS = 'RESET_UPDATE_NOTIFICATIONS_USERS';
export const UPDATE_NOTIFICATION_USERS = 'UPDATE_NOTIFICATION_USERS';
export const UPDATE_NOTIFICATION_USERS_FAILURE = 'UPDATE_NOTIFICATION_USERS_FAILURE';
export const UPDATE_NOTIFICATION_USERS_SUCCESS = 'UPDATE_NOTIFICATION_USERS_SUCCESS';

interface UpdateNotificationUsersAction {
  type: typeof UPDATE_NOTIFICATION_USERS;
}

interface ResetUpdateNotificationUsersAction {
  type: typeof RESET_UPDATE_NOTIFICATIONS_USERS;
}

interface UpdateNotificationUsersFailureAction {
  type: typeof UPDATE_NOTIFICATION_USERS_FAILURE;
  payload: Error;
}

interface UpdateNotificationUsersSuccessAction {
  type: typeof UPDATE_NOTIFICATION_USERS_SUCCESS;
  payload: string;
}

export type UpdateNotificationsUsersActions =
  | UpdateNotificationUsersAction
  | UpdateNotificationUsersFailureAction
  | UpdateNotificationUsersSuccessAction
  | ResetUpdateNotificationUsersAction;
