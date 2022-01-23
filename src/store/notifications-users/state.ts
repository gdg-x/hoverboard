import { Initialized, RemoteData } from '@abraham/remotedata';

export interface UserTokens {
  id: string;
  tokens: {
    [key: string]: true;
  };
}

export type UserTokensData = Omit<UserTokens, 'id'>;

export type NotificationsUsersState = RemoteData<Error, UserTokens>;
export const initialNotificationsUsersState: NotificationsUsersState = new Initialized();
