import { orderBy } from 'firebase/firestore';
import { Photo } from '../models/photo';
import { subscribeToCollection, Subscription } from '../utils/firestore';

export const subscribeToGallery = (
  onStart: () => void,
  onNext: (payload: Photo[]) => void,
  onError: (error: Error) => void,
): Subscription => {
  return subscribeToCollection<Photo>('gallery', onStart, onNext, onError, orderBy('order'));
};
