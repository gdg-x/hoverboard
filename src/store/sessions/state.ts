import { Initialized, RemoteData } from '@abraham/remotedata';
import { Session } from '../../models/session';

export type SessionsState = RemoteData<Error, Session[]>;
export const initialSessionsState: SessionsState = new Initialized();
