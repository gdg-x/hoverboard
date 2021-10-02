import { Initialized, RemoteData } from '@abraham/remotedata';
import { Speaker } from '../../models/speaker';

export type PreviousSpeakersState = RemoteData<Error, Speaker[]>;
export const initialPreviousSpeakersState: PreviousSpeakersState = new Initialized();
