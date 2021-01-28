import { Initialized, RemoteData } from '@abraham/remotedata';
import { User } from '../../models/user';

export type UserState = RemoteData<Error, User>;
export const initialUserState: UserState = new Initialized();
