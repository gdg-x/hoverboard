import { Initialized, RemoteData } from '@abraham/remotedata';

export type NotificationsSubscribersState = RemoteData<Error, string>;
export const initialNotificationsSubscribersState: NotificationsSubscribersState =
  new Initialized();
