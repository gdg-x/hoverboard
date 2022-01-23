import { Initialized, RemoteData } from '@abraham/remotedata';

export type UpdateNotificationsSubscribersState = RemoteData<Error, string>;
export const initialUpdateNotificationsSubscribersState: UpdateNotificationsSubscribersState =
  new Initialized();
