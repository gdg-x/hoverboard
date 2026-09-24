import { orderBy } from 'firebase/firestore';
import { describe, expect, it, vi } from 'vitest';
import { subscribeToGallery } from './gallery';
import { subscribeToCollection } from '../utils/firestore';

vi.mock('../utils/firestore');

describe('db/gallery', () => {
  it('subscribes to gallery collection ordered by order', () => {
    const onStart = vi.fn();
    const onNext = vi.fn();
    const onError = vi.fn();

    subscribeToGallery(onStart, onNext, onError);

    expect(subscribeToCollection).toHaveBeenCalledWith(
      'gallery',
      onStart,
      onNext,
      onError,
      orderBy('order'),
    );
  });
});
