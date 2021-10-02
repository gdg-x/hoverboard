import { Initialized, RemoteData } from '@abraham/remotedata';
import { Video } from '../../models/video';

export type VideoState = RemoteData<Error, Video[]>;
export const initialVideosState: VideoState = new Initialized();
