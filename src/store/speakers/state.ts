import { Initialized, RemoteData } from '@abraham/remotedata';
import { SpeakerWithTags } from '../../models/speaker';

export type SpeakersState = RemoteData<Error, SpeakerWithTags[]>;
export const initialSpeakersState: SpeakersState = new Initialized();
