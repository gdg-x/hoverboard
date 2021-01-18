import { Initialized, RemoteData } from '@abraham/remotedata';

export interface FeaturedSessions {
  [sessionId: string]: boolean;
}

export type FeaturedSessionsState = RemoteData<Error, FeaturedSessions>;
export const initialFeaturedSessionsState: FeaturedSessionsState = new Initialized();
