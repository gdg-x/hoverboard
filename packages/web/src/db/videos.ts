import { orderBy } from 'firebase/firestore';
import type { Video } from '../models/video';
import { subscribeToCollection, type Subscription } from '../utils/firestore';

export const subscribeToVideos = (
  onStart: () => void,
  onNext: (payload: Video[]) => void,
  onError: (error: Error) => void,
): Subscription => {
  return subscribeToCollection<Video>('videos', onStart, onNext, onError, orderBy('order'));
};
