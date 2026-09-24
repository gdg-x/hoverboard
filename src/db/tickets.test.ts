import { orderBy } from 'firebase/firestore';
import { describe, expect, it, vi } from 'vitest';
import { subscribeToTickets } from './tickets';
import { subscribeToCollection } from '../utils/firestore';

vi.mock('../utils/firestore');

describe('db/tickets', () => {
  it('subscribes to tickets collection ordered by order', () => {
    const onStart = vi.fn();
    const onNext = vi.fn();
    const onError = vi.fn();

    subscribeToTickets(onStart, onNext, onError);

    expect(subscribeToCollection).toHaveBeenCalledWith(
      'tickets',
      onStart,
      onNext,
      onError,
      orderBy('order'),
    );
  });
});
