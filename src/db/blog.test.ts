import { orderBy } from 'firebase/firestore';
import { describe, expect, it, vi } from 'vitest';
import { subscribeToBlog } from './blog';
import { subscribeToCollection } from '../utils/firestore';

vi.mock('../utils/firestore');

describe('db/blog', () => {
  it('subscribes to blog collection ordered by published desc', () => {
    const onStart = vi.fn();
    const onNext = vi.fn();
    const onError = vi.fn();

    subscribeToBlog(onStart, onNext, onError);

    expect(subscribeToCollection).toHaveBeenCalledWith(
      'blog',
      onStart,
      onNext,
      onError,
      orderBy('published', 'desc'),
    );
  });
});
