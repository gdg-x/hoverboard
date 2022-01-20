import { Initialized, RemoteData } from '@abraham/remotedata';

export type NotificationsSubscribersState = RemoteData<Error, string | undefined>;
export const initialNotificationsSubscribersState: NotificationsSubscribersState =
  new Initialized();
