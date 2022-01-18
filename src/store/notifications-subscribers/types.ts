export const RESET_NOTIFICATION_SUBSCRIBERS = 'RESET_NOTIFICATION_SUBSCRIBERS';
export const SET_NOTIFICATION_SUBSCRIBERS = 'SET_NOTIFICATION_SUBSCRIBERS';
export const SET_NOTIFICATION_SUBSCRIBERS_FAILURE = 'SET_NOTIFICATION_SUBSCRIBERS_FAILURE';
export const SET_NOTIFICATION_SUBSCRIBERS_SUCCESS = 'SET_NOTIFICATION_SUBSCRIBERS_SUCCESS';

interface SetNotificationSubscribersAction {
  type: typeof SET_NOTIFICATION_SUBSCRIBERS;
}

interface ResetNotificationSubscribersAction {
  type: typeof RESET_NOTIFICATION_SUBSCRIBERS;
}

interface SetNotificationSubscribersFailureAction {
  type: typeof SET_NOTIFICATION_SUBSCRIBERS_FAILURE;
  payload: Error;
}

interface SetNotificationSubscribersSuccessAction {
  type: typeof SET_NOTIFICATION_SUBSCRIBERS_SUCCESS;
  payload: string;
}

export type NotificationSubscribersActions =
  | SetNotificationSubscribersAction
  | SetNotificationSubscribersFailureAction
  | SetNotificationSubscribersSuccessAction
  | ResetNotificationSubscribersAction;
