export const NOTIFICATIONS_FAILURE = 'NOTIFICATIONS_FAILURE';
export const NOTIFICATIONS_SUCCESS = 'NOTIFICATIONS_SUCCESS';
export const REMOVE_NOTIFICATIONS = 'REMOVE_NOTIFICATIONS';

// TODO: Match built in types
export enum NOTIFICATIONS_STATUS {
  GRANTED = 'granted',
  DENIED = 'denied',
  DEFAULT = 'default',
}

interface NotificationStatus {
  status: NOTIFICATIONS_STATUS;
  token?: string;
}

interface NotificationsSuccessAction {
  type: typeof NOTIFICATIONS_SUCCESS;
  payload: NotificationStatus;
}

interface NotificationsFailureAction {
  type: typeof NOTIFICATIONS_FAILURE;
  payload: Error;
}

interface RemoveNotificationsAction {
  type: typeof REMOVE_NOTIFICATIONS;
}

export type NotificationActions =
  | NotificationsSuccessAction
  | NotificationsFailureAction
  | RemoveNotificationsAction;
