import { orderBy } from 'firebase/firestore';
import { describe, expect, it, vi } from 'vitest';
import { subscribeToTeams } from './teams';
import { subscribeToCollection } from '../utils/firestore';

vi.mock('../utils/firestore');

describe('db/teams', () => {
  it('subscribes to team collection ordered by title', () => {
    const onStart = vi.fn();
    const onNext = vi.fn();
    const onError = vi.fn();

    subscribeToTeams(onStart, onNext, onError);

    expect(subscribeToCollection).toHaveBeenCalledWith(
      'team',
      onStart,
      onNext,
      onError,
      orderBy('title'),
    );
  });
});
