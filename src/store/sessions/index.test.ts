import { Initialized, Pending, Success } from '@abraham/remotedata';
import { orderBy } from 'firebase/firestore';
import { describe, expect, it, vi } from 'vitest';
import reducer, { selectSessionsState } from '.';
import { Session } from '../../models/session';
import { subscribeToCollection } from '../../utils/firestore';
import { RootState } from '..';

vi.mock('../../utils/firestore');
vi.mock('../dispatch');

describe('sessions', () => {
  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });
});

describe('selectSessionsState', () => {
  it('subscribes on first read', () => {
    vi.mocked(subscribeToCollection).mockReturnValue(new Success(vi.fn()));
    const state = { sessions: new Initialized() } as unknown as RootState;

    expect(selectSessionsState(state)).toStrictEqual(new Pending());
    expect(subscribeToCollection).toHaveBeenCalledWith(
      'generatedSessions',
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      orderBy('id'),
    );
  });

  it('returns the existing state without re-fetching once loaded', () => {
    const items = [{ id: '1' }] as unknown as Session[];
    const state = { sessions: new Success(items) } as unknown as RootState;

    expect(selectSessionsState(state)).toStrictEqual(new Success(items));
  });
});
