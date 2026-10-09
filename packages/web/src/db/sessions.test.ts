import { documentId, orderBy } from 'firebase/firestore';
import { describe, expect, it, vi } from 'vitest';
import { subscribeToSessions } from './sessions';
import { subscribeToCollection } from '../utils/firestore';

vi.mock('../utils/firestore');

describe('db/sessions', () => {
  it('subscribes to the sessions collection by document ID', () => {
    const onStart = vi.fn();
    const onNext = vi.fn();
    const onError = vi.fn();

    subscribeToSessions(onStart, onNext, onError);

    expect(subscribeToCollection).toHaveBeenCalledWith(
      'sessions',
      onStart,
      onNext,
      onError,
      orderBy(documentId()),
    );
  });
});
