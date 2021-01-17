import { Pending, RemoteData } from '@abraham/remotedata';
import { Speaker } from '../../models/speaker';

export type SpeakersState = RemoteData<Error, Speaker[]>;
export const initialSpeakersState: SpeakersState = new Pending();
