export const FETCH_NOTIFICATIONS_SUBSCRIBERS = 'FETCH_NOTIFICATIONS_SUBSCRIBERS';
export const FETCH_NOTIFICATIONS_SUBSCRIBERS_FAILURE = 'FETCH_NOTIFICATIONS_SUBSCRIBERS_FAILURE';
export const FETCH_NOTIFICATIONS_SUBSCRIBERS_SUCCESS = 'FETCH_NOTIFICATIONS_SUBSCRIBERS_SUCCESS';

interface FetchNotificationSubscribersAction {
  type: typeof FETCH_NOTIFICATIONS_SUBSCRIBERS;
}

interface FetchNotificationSubscribersFailureAction {
  type: typeof FETCH_NOTIFICATIONS_SUBSCRIBERS_FAILURE;
  payload: Error;
}

interface FetchNotificationSubscribersSuccessAction {
  type: typeof FETCH_NOTIFICATIONS_SUBSCRIBERS_SUCCESS;
  payload: string | undefined;
}

export type NotificationsSubscribersActions =
  | FetchNotificationSubscribersAction
  | FetchNotificationSubscribersFailureAction
  | FetchNotificationSubscribersSuccessAction;
