export const UPDATE_NOTIFICATIONS_STATUS = 'UPDATE_NOTIFICATIONS_STATUS';
export enum NOTIFICATIONS_STATUS {
  GRANTED = 'granted',
  DENIED = 'denied',
  DEFAULT = 'default',
}

export interface NotificationState {
  status: NOTIFICATIONS_STATUS;
}

interface UpdateNotificationsStatusAction {
  type: typeof UPDATE_NOTIFICATIONS_STATUS;
  status: NOTIFICATIONS_STATUS;
  token?: string;
}

export type NotificationActionTypes = UpdateNotificationsStatusAction;
