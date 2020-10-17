import { Initialized, RemoteData } from '@abraham/remotedata';
import { PreviousSpeaker } from '../../models/previous-speaker';

export type PreviousSpeakersState = RemoteData<Error, PreviousSpeaker[]>;
export const initialPreviousSpeakersState: PreviousSpeakersState = new Initialized();
