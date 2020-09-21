import { Initialized, RemoteData } from '@abraham/remotedata';

export type NotificationState = RemoteData<Error, string>;
export const initialNotificationState: NotificationState = new Initialized();
