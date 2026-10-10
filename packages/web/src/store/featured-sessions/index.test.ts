import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import reducer, {
  unsyncedSessions,
  resetFeaturedSessions,
  selectFeaturedSessions,
  selectFeaturedSessionsState,
  setUserFeaturedSessions,
} from '.';
import { saveFeaturedSessions, subscribeToFeaturedSessions } from '../../db/featured-sessions';
import { dispatch, getState } from '../dispatch';
import { queueSnackbar } from '../snackbars';
import { selectUserId } from '../user';
import type { RootState } from '..';

vi.mock('../../db/featured-sessions');
vi.mock('../dispatch');
vi.mock('../sync', () => ({ setPendingIds: vi.fn() }));
vi.mock('../snackbars', () => ({
  queueSnackbar: vi.fn((label: string) => ({
    type: 'snackbars/queueSnackbar',
    payload: label,
  })),
}));
vi.mock('../user', () => ({
  selectUserId: vi.fn(),
}));

const ADDED = 'Session saved to My Schedule';

describe('featuredSessions', () => {
  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });

  it('handles its state transitions', () => {
    const data = { 'session-1': true };
    const error = new Error('boom');

    expect(reducer(new Initialized(), { type: 'featuredSessions/pending' })).toStrictEqual(
      new Pending(),
    );
    expect(
      reducer(new Pending(), { type: 'featuredSessions/success', payload: data }),
    ).toStrictEqual(new Success(data));
    expect(
      reducer(new Pending(), { type: 'featuredSessions/failure', payload: error }),
    ).toStrictEqual(new Failure(error));
    expect(reducer(new Success(data), { type: 'featuredSessions/reset' })).toStrictEqual(
      new Initialized(),
    );
  });
});

describe('setUserFeaturedSessions', () => {
  it('writes only the saved sessions, and confirms without waiting for the server', () => {
    setUserFeaturedSessions(
      'user-1',
      { 'session-1': true, 'session-2': false, 'session-3': 0 as never },
      true,
    );

    expect(saveFeaturedSessions).toHaveBeenCalledWith(
      'user-1',
      { 'session-1': true },
      expect.any(Function),
    );
    // The listener updates the saved sessions, so the store only queues the confirmation.
    expect(vi.mocked(dispatch).mock.calls.map(([action]) => action)).toEqual([
      { type: 'snackbars/queueSnackbar', payload: ADDED },
    ]);
  });

  it('says so when the server refuses the saved sessions', () => {
    vi.mocked(saveFeaturedSessions).mockImplementation((_userId, _sessions, onRejected) =>
      onRejected(new Error('permission-denied')),
    );

    setUserFeaturedSessions('user-1', { 'session-1': true }, false);

    expect(queueSnackbar).toHaveBeenCalledWith("Couldn't save your schedule. Try again.");
  });
});

describe('unsyncedSessions', () => {
  it('is empty once the server has confirmed the saved sessions', () => {
    expect(unsyncedSessions({ a: true }, false, undefined)).toEqual([]);
  });

  it('lists the sessions saved or unsaved since the server confirmed them', () => {
    expect(unsyncedSessions({ a: true, c: true }, true, { a: true, b: true })).toEqual(['c', 'b']);
  });

  it('lists every saved session before the server has answered, as after a reload offline', () => {
    expect(unsyncedSessions({ a: true, b: false }, true, undefined)).toEqual(['a']);
  });
});

describe('featured session selectors', () => {
  const listen = () => {
    const unsubscribe = vi.fn();
    let onNext: ((sessions: Record<string, boolean>) => void) | undefined;
    vi.mocked(subscribeToFeaturedSessions).mockImplementation((_userId, onStart, next) => {
      onNext = (sessions) => next(sessions, { pending: false });
      onStart();
      return new Success(unsubscribe);
    });
    return { unsubscribe, next: (sessions: Record<string, boolean>) => onNext!(sessions) };
  };
  const initialized = { featuredSessions: new Initialized() } as unknown as RootState;

  it("listens to a signed-in visitor's saved sessions the first time the state is read", () => {
    vi.mocked(selectUserId).mockReturnValue('user-1');
    vi.mocked(getState).mockReturnValue({} as RootState);
    const { next } = listen();

    expect(selectFeaturedSessionsState(initialized)).toStrictEqual(new Initialized());
    selectFeaturedSessionsState(initialized);
    next({ 'session-1': true });
    next({ 'session-1': true, 'session-2': true });

    expect(subscribeToFeaturedSessions).toHaveBeenCalledOnce();
    expect(subscribeToFeaturedSessions).toHaveBeenCalledWith(
      'user-1',
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    );
    expect(vi.mocked(dispatch).mock.calls.map(([action]) => action)).toEqual([
      expect.objectContaining({ type: 'featuredSessions/pending' }),
      { type: 'featuredSessions/success', payload: { 'session-1': true } },
      { type: 'featuredSessions/success', payload: { 'session-1': true, 'session-2': true } },
    ]);
    resetFeaturedSessions();
  });

  it('stops listening on reset, and listens again for the next visitor', () => {
    vi.mocked(selectUserId).mockReturnValue('user-1');
    vi.mocked(getState).mockReturnValue({} as RootState);
    const { unsubscribe } = listen();

    selectFeaturedSessionsState(initialized);
    resetFeaturedSessions();
    vi.mocked(selectUserId).mockReturnValue('user-2');
    selectFeaturedSessionsState(initialized);

    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(subscribeToFeaturedSessions).toHaveBeenLastCalledWith(
      'user-2',
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    );
    resetFeaturedSessions();
  });

  it('does nothing without a signed-in user', () => {
    vi.mocked(selectUserId).mockReturnValue(undefined);
    vi.mocked(getState).mockReturnValue({} as RootState);

    expect(selectFeaturedSessionsState(initialized)).toStrictEqual(new Initialized());

    expect(subscribeToFeaturedSessions).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('returns featured session data only when loaded', () => {
    const loadedState = {
      featuredSessions: new Success({ 'session-1': true }),
    } as unknown as RootState;
    const pendingState = {
      featuredSessions: new Pending(),
    } as unknown as RootState;

    expect(selectFeaturedSessions(loadedState)).toStrictEqual({ 'session-1': true });
    expect(selectFeaturedSessions(pendingState)).toStrictEqual({});
  });
});

describe('resetFeaturedSessions', () => {
  it('dispatches reset', () => {
    resetFeaturedSessions();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'featuredSessions/reset' }),
    );
  });
});
