import { orderBy } from 'firebase/firestore';
import { describe, expect, it, vi } from 'vitest';
import { subscribeToSchedule } from './schedule';
import { subscribeToCollection } from '../utils/firestore';

vi.mock('../utils/firestore');

describe('db/schedule', () => {
  it('subscribes to generatedSchedule collection ordered by date', () => {
    const onStart = vi.fn();
    const onNext = vi.fn();
    const onError = vi.fn();

    subscribeToSchedule(onStart, onNext, onError);

    expect(subscribeToCollection).toHaveBeenCalledWith(
      'generatedSchedule',
      onStart,
      onNext,
      onError,
      orderBy('date'),
    );
  });
});
