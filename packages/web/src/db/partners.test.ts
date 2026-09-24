import { collection, collectionGroup, onSnapshot, orderBy, query } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { subscribeToPartnerGroups, subscribeToPartners } from './partners';
import { db } from '../firebase';

vi.mock('firebase/firestore');

describe('db/partners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes to partners items collection group ordered by order', () => {
    const unsubscribe = vi.fn();
    vi.mocked(collectionGroup).mockReturnValue('items-group' as never);
    vi.mocked(orderBy).mockReturnValue('order-clause' as never);
    vi.mocked(query).mockReturnValue('query-ref' as never);
    vi.mocked(onSnapshot).mockImplementation((_q, onNext) => {
      (onNext as (snapshot: unknown) => void)({
        docs: [
          {
            id: 'partner-1',
            data: () => ({ name: 'Partner One', order: 1 }),
            ref: { parent: { parent: { id: 'group-1' } } },
          },
        ],
      });
      return unsubscribe;
    });

    const onNext = vi.fn();
    const onError = vi.fn();

    const unsub = subscribeToPartners(onNext, onError);

    expect(unsub).toBe(unsubscribe);
    expect(collectionGroup).toHaveBeenCalledWith(db, 'items');
    expect(orderBy).toHaveBeenCalledWith('order');
    expect(onNext).toHaveBeenCalledWith([
      { id: 'partner-1', name: 'Partner One', order: 1, parentId: 'group-1' },
    ]);
  });

  it('forwards error to onError in subscribeToPartners', () => {
    const error = new Error('boom');
    vi.mocked(onSnapshot).mockImplementation((_q, _onNext, onError) => {
      (onError as unknown as (err: Error) => void)(error);
      return vi.fn();
    });

    const onError = vi.fn();
    subscribeToPartners(vi.fn(), onError);

    expect(onError).toHaveBeenCalledWith(error);
  });

  it('subscribes to partner groups collection ordered by order', () => {
    const unsubscribe = vi.fn();
    vi.mocked(collection).mockReturnValue('partners-coll' as never);
    vi.mocked(orderBy).mockReturnValue('order-clause' as never);
    vi.mocked(query).mockReturnValue('query-ref' as never);
    vi.mocked(onSnapshot).mockImplementation((_q, onNext) => {
      (onNext as (snapshot: unknown) => void)({
        docs: [
          {
            id: 'group-1',
            data: () => ({ title: 'Gold', order: 1 }),
          },
        ],
      });
      return unsubscribe;
    });

    const onNext = vi.fn();
    const onError = vi.fn();

    const unsub = subscribeToPartnerGroups(onNext, onError);

    expect(unsub).toBe(unsubscribe);
    expect(collection).toHaveBeenCalledWith(db, 'partners');
    expect(orderBy).toHaveBeenCalledWith('order');
    expect(onNext).toHaveBeenCalledWith([{ id: 'group-1', title: 'Gold', order: 1 }]);
  });

  it('forwards error to onError in subscribeToPartnerGroups', () => {
    const error = new Error('boom');
    vi.mocked(onSnapshot).mockImplementation((_q, _onNext, onError) => {
      (onError as unknown as (err: Error) => void)(error);
      return vi.fn();
    });

    const onError = vi.fn();
    subscribeToPartnerGroups(vi.fn(), onError);

    expect(onError).toHaveBeenCalledWith(error);
  });
});
