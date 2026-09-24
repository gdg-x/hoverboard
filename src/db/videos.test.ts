import { orderBy } from 'firebase/firestore';
import { describe, expect, it, vi } from 'vitest';
import { subscribeToVideos } from './videos';
import { subscribeToCollection } from '../utils/firestore';

vi.mock('../utils/firestore');

describe('db/videos', () => {
  it('subscribes to videos collection ordered by order', () => {
    const onStart = vi.fn();
    const onNext = vi.fn();
    const onError = vi.fn();

    subscribeToVideos(onStart, onNext, onError);

    expect(subscribeToCollection).toHaveBeenCalledWith(
      'videos',
      onStart,
      onNext,
      onError,
      orderBy('order'),
    );
  });
});
