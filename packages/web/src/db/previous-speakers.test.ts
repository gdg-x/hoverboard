import { describe, expect, it, vi } from 'vitest';
import { subscribeToPreviousSpeakers } from './previous-speakers';
import { subscribeToCollection } from '../utils/firestore';

vi.mock('../utils/firestore');

describe('db/previous-speakers', () => {
  it('subscribes to previousSpeakers collection', () => {
    const onStart = vi.fn();
    const onNext = vi.fn();
    const onError = vi.fn();

    subscribeToPreviousSpeakers(onStart, onNext, onError);

    expect(subscribeToCollection).toHaveBeenCalledWith(
      'previousSpeakers',
      onStart,
      onNext,
      onError,
    );
  });
});
