import { Initialized, Pending, Success } from '@abraham/remotedata';
import { orderBy } from 'firebase/firestore';
import { describe, expect, it, vi } from 'vitest';
import reducer, { selectTickets } from '.';
import { Ticket } from '../../models/ticket';
import { subscribeToCollection } from '../../utils/firestore';
import { RootState } from '..';

vi.mock('../../utils/firestore');
vi.mock('../dispatch');

describe('tickets', () => {
  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });
});

describe('selectTickets', () => {
  it('subscribes on first read', () => {
    vi.mocked(subscribeToCollection).mockReturnValue(new Success(vi.fn()));
    const state = { tickets: new Initialized() } as unknown as RootState;

    expect(selectTickets(state)).toStrictEqual(new Pending());
    expect(subscribeToCollection).toHaveBeenCalledWith(
      'tickets',
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      orderBy('order'),
    );
  });

  it('returns the existing state without re-fetching once loaded', () => {
    const items = [{ id: '1' }] as unknown as Ticket[];
    const state = { tickets: new Success(items) } as unknown as RootState;

    expect(selectTickets(state)).toStrictEqual(new Success(items));
  });
});
