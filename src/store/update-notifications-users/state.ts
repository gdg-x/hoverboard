import { Initialized, RemoteData } from '@abraham/remotedata';

export type UpdateNotificationsUsersState = RemoteData<Error, string>;
export const initialUpdateNotificationsUsersState: UpdateNotificationsUsersState =
  new Initialized();
