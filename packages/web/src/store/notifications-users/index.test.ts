import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import { subscribeToNotificationsUsers } from '../../db/notifications-users';
import { dispatch } from '../dispatch';
import { RootState } from '..';

vi.mock('../../db/notifications-users');
vi.mock('../dispatch');

const loadModule = async () => import('.');

describe('notificationsUsers', () => {
  it('starts in the Initialized state', async () => {
    vi.resetModules();
    const { default: reducer } = await loadModule();

    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });

  it('handles its reducer transitions', async () => {
    vi.resetModules();
    const { default: reducer } = await loadModule();
    const error = new Error('boom');
    const payload = { id: 'user-1', tokens: { 'token-123': true } };

    expect(reducer(new Initialized(), { type: 'notificationsUsers/pending' })).toStrictEqual(
      new Pending(),
    );
    expect(reducer(new Pending(), { type: 'notificationsUsers/success', payload })).toStrictEqual(
      new Success(payload),
    );
    expect(
      reducer(new Pending(), { type: 'notificationsUsers/failure', payload: error }),
    ).toStrictEqual(new Failure(error));
  });
});

describe('selectNotificationsUsersSubscribed', () => {
  it('subscribes on first read and dispatches lifecycle updates from the callbacks', async () => {
    vi.resetModules();
    let onStart: (() => void) | undefined;
    let onNext:
      ((payload: { id: string; tokens: Record<string, true> } | undefined) => void) | undefined;
    let onError: ((error: Error) => void) | undefined;

    vi.mocked(subscribeToNotificationsUsers).mockImplementation((_uid, start, next, error) => {
      onStart = start;
      onNext = next;
      onError = error;
      return new Success(vi.fn());
    });

    const { selectNotificationsUsersSubscribed } = await loadModule();
    const state = {
      notificationPermission: { value: new Success('token-123') },
      notificationsUsers: new Initialized(),
      user: new Success({ uid: 'user-1' }),
    } as unknown as RootState;

    expect(selectNotificationsUsersSubscribed(state)).toBe(false);
    expect(subscribeToNotificationsUsers).toHaveBeenCalledWith(
      'user-1',
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    );

    onStart?.();
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'notificationsUsers/pending' }),
    );

    onNext?.({ id: 'user-1', tokens: { 'token-123': true } });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'notificationsUsers/success',
        payload: { id: 'user-1', tokens: { 'token-123': true } },
      }),
    );

    onNext?.(undefined);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'notificationsUsers/success',
        payload: { id: 'user-1', tokens: {} },
      }),
    );

    const error = new Error('boom');
    onError?.(error);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'notificationsUsers/failure',
        payload: error,
      }),
    );
  });

  it('returns whether the current notification token is already stored for the user', async () => {
    vi.resetModules();
    const { selectNotificationsUsersSubscribed } = await loadModule();
    const subscribedState = {
      notificationPermission: { value: new Success('token-123') },
      notificationsUsers: new Success({ id: 'user-1', tokens: { 'token-123': true } }),
    } as unknown as RootState;
    const unsubscribedState = {
      notificationPermission: { value: new Success('token-999') },
      notificationsUsers: new Success({ id: 'user-1', tokens: { 'token-123': true } }),
    } as unknown as RootState;

    expect(selectNotificationsUsersSubscribed(subscribedState)).toBe(true);
    expect(selectNotificationsUsersSubscribed(unsubscribedState)).toBe(false);
    expect(subscribeToNotificationsUsers).not.toHaveBeenCalled();
  });
});
