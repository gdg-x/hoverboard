import { describe, expect, it, vi } from 'vitest';
import { subscribeToSpeakers } from './speakers';
import { subscribeToCollection } from '../utils/firestore';

vi.mock('../utils/firestore');

describe('db/speakers', () => {
  it('subscribes to generatedSpeakers collection', () => {
    const onStart = vi.fn();
    const onNext = vi.fn();
    const onError = vi.fn();

    subscribeToSpeakers(onStart, onNext, onError);

    expect(subscribeToCollection).toHaveBeenCalledWith(
      'generatedSpeakers',
      onStart,
      onNext,
      onError,
    );
  });
});
