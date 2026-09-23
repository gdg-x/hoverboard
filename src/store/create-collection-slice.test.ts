import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import { createCollectionSlice } from './create-collection-slice';
import { Subscription } from '../utils/firestore';

// fetch()'s onStart/onNext/onError callbacks dispatch through the lazily
// bound `dispatch` from `../dispatch`, which throws unless the real store
// has been initialized. Mock it so the slice's own reducer logic (under
// test here) can be exercised in isolation.
vi.mock('./dispatch');

interface Item {
  id: string;
  name: string;
}

describe('createCollectionSlice', () => {
  it('starts in the Initialized state', () => {
    const { reducer } = createCollectionSlice<Item>('items', () => new Initialized());

    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });

  it('transitions to Pending, then Success as the subscription reports data', () => {
    let onNext: ((payload: Item[]) => void) | undefined;
    const subscribeToSource = vi.fn(
      (onStart: () => void, next: (payload: Item[]) => void): Subscription => {
        onNext = next;
        onStart();

        return new Success(vi.fn());
      },
    );
    const { reducer, selectOrFetch } = createCollectionSlice<Item>('items', subscribeToSource);

    // selectOrFetch triggers the (lazy) fetch the first time state is read.
    let state = reducer(undefined, { type: '@@INIT' });
    state = reducer(state, { type: 'items/pending' });

    expect(selectOrFetch(new Initialized())).toStrictEqual(new Pending());
    expect(subscribeToSource).toHaveBeenCalledTimes(1);

    const items: Item[] = [{ id: '1', name: 'Ada' }];
    state = reducer(state, { type: 'items/success', payload: items });

    expect(state).toStrictEqual(new Success(items));
    expect(onNext).toBeDefined();
  });

  it('transitions to Failure on error', () => {
    const { reducer } = createCollectionSlice<Item>('items', () => new Initialized());
    const error = new Error('boom');

    const state = reducer(new Pending(), { type: 'items/failure', payload: error });

    expect(state).toStrictEqual(new Failure(error));
  });

  it('only fetches once across multiple selectOrFetch calls while Initialized', () => {
    const subscribeToSource = vi.fn().mockReturnValue(new Success(vi.fn()));
    const { selectOrFetch } = createCollectionSlice<Item>('items', subscribeToSource);

    selectOrFetch(new Initialized());
    selectOrFetch(new Initialized());

    expect(subscribeToSource).toHaveBeenCalledTimes(1);
  });

  it('returns non-Initialized state unchanged without fetching', () => {
    const subscribeToSource = vi.fn();
    const { selectOrFetch } = createCollectionSlice<Item>('items', subscribeToSource);
    const success = new Success<Item[]>([{ id: '1', name: 'Ada' }]);

    expect(selectOrFetch(success)).toBe(success);
    expect(subscribeToSource).not.toHaveBeenCalled();
  });

  it('unsubscribes and resets to Initialized', () => {
    const unsubscribe = vi.fn();
    const subscribeToSource = vi.fn().mockReturnValue(new Success(unsubscribe));
    const { selectOrFetch, unsubscribe: unsubscribeFn } = createCollectionSlice<Item>(
      'items',
      subscribeToSource,
    );

    selectOrFetch(new Initialized());
    unsubscribeFn();

    expect(unsubscribe).toHaveBeenCalled();
    // Fetching again after unsubscribing should re-subscribe.
    selectOrFetch(new Initialized());
    expect(subscribeToSource).toHaveBeenCalledTimes(2);
  });

  it('does nothing when unsubscribing while not subscribed', () => {
    const subscribeToSource = vi.fn();
    const { unsubscribe } = createCollectionSlice<Item>('items', subscribeToSource);

    expect(() => unsubscribe()).not.toThrow();
    expect(subscribeToSource).not.toHaveBeenCalled();
  });
});
