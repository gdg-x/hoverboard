export const RESET_UPDATE_NOTIFICATIONS_SUBSCRIBERS = 'RESET_UPDATE_NOTIFICATIONS_SUBSCRIBERS';
export const UPDATE_NOTIFICATION_SUBSCRIBERS = 'UPDATE_NOTIFICATION_SUBSCRIBERS';
export const UPDATE_NOTIFICATION_SUBSCRIBERS_FAILURE = 'UPDATE_NOTIFICATION_SUBSCRIBERS_FAILURE';
export const UPDATE_NOTIFICATION_SUBSCRIBERS_SUCCESS = 'UPDATE_NOTIFICATION_SUBSCRIBERS_SUCCESS';

interface UpdateNotificationSubscribersAction {
  type: typeof UPDATE_NOTIFICATION_SUBSCRIBERS;
}

interface ResetUpdateNotificationSubscribersAction {
  type: typeof RESET_UPDATE_NOTIFICATIONS_SUBSCRIBERS;
}

interface UpdateNotificationSubscribersFailureAction {
  type: typeof UPDATE_NOTIFICATION_SUBSCRIBERS_FAILURE;
  payload: Error;
}

interface UpdateNotificationSubscribersSuccessAction {
  type: typeof UPDATE_NOTIFICATION_SUBSCRIBERS_SUCCESS;
  payload: string;
}

export type UpdateNotificationsSubscribersActions =
  | UpdateNotificationSubscribersAction
  | UpdateNotificationSubscribersFailureAction
  | UpdateNotificationSubscribersSuccessAction
  | ResetUpdateNotificationSubscribersAction;
