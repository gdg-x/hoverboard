import { Initialized, RemoteData } from '@abraham/remotedata';

export type SubscribeState = RemoteData<Error, true>;
export const initialSubscribeState: SubscribeState = new Initialized();
