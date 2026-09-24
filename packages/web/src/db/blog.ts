import { orderBy } from 'firebase/firestore';
import { Post } from '../models/post';
import { subscribeToCollection, Subscription } from '../utils/firestore';

export const subscribeToBlog = (
  onStart: () => void,
  onNext: (payload: Post[]) => void,
  onError: (error: Error) => void,
): Subscription => {
  return subscribeToCollection<Post>(
    'blog',
    onStart,
    onNext,
    onError,
    orderBy('published', 'desc'),
  );
};
