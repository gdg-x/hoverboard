import { Initialized, RemoteData } from '@abraham/remotedata';
import { Photo } from '../../models/photo';

export type GalleryState = RemoteData<Error, Photo[]>;
export const initialGalleryState: GalleryState = new Initialized();
