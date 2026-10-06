import { orderBy } from 'firebase/firestore';
import type { Post } from '../models/post';
import { subscribeToCollection, type Subscription } from '../utils/firestore';

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
