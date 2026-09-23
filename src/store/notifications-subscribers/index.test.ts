import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import { subscribeToDocument } from '../../utils/firestore';
import { dispatch } from '../dispatch';
import { RootState } from '..';

vi.mock('../../utils/firestore');
vi.mock('../dispatch');

const loadModule = async () => import('.');

describe('notificationsSubscribers', () => {
  it('starts in the Initialized state', async () => {
    vi.resetModules();
    const { default: reducer, initialNotificationsSubscribersState } = await loadModule();

    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(
      initialNotificationsSubscribersState,
    );
  });

  it('handles its reducer transitions', async () => {
    vi.resetModules();
    const { default: reducer } = await loadModule();
    const error = new Error('boom');

    expect(reducer(new Initialized(), { type: 'notificationsSubscribers/pending' })).toStrictEqual(
      new Pending(),
    );
    expect(
      reducer(new Pending(), {
        type: 'notificationsSubscribers/success',
        payload: 'user-1',
      }),
    ).toStrictEqual(new Success('user-1'));
    expect(
      reducer(new Pending(), {
        type: 'notificationsSubscribers/failure',
        payload: error,
      }),
    ).toStrictEqual(new Failure(error));
  });
});

describe('selectNotificationsSubscribers', () => {
  it('subscribes on first read and dispatches lifecycle updates from the callbacks', async () => {
    vi.resetModules();
    let onStart: (() => void) | undefined;
    let onNext: ((payload: { id: string | undefined } | undefined) => void) | undefined;
    let onError: ((error: Error) => void) | undefined;

    vi.mocked(subscribeToDocument).mockImplementation((_path, start, next, error) => {
      onStart = start;
      onNext = next;
      onError = error;
      return new Success(vi.fn());
    });

    const { selectNotificationsSubscribers } = await loadModule();
    const state = {
      notificationPermission: { value: new Success('token-123') },
      notificationsSubscribers: new Initialized(),
    } as unknown as RootState;

    expect(selectNotificationsSubscribers(state)).toStrictEqual(new Pending());
    expect(subscribeToDocument).toHaveBeenCalledWith(
      'notificationsSubscribers/token-123',
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    );

    onStart?.();
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'notificationsSubscribers/pending' }),
    );

    onNext?.({ id: 'user-1' });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'notificationsSubscribers/success',
        payload: 'user-1',
      }),
    );

    onNext?.(undefined);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'notificationsSubscribers/success',
        payload: '',
      }),
    );

    const error = new Error('boom');
    onError?.(error);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'notificationsSubscribers/failure',
        payload: error,
      }),
    );
  });

  it('returns the existing state without subscribing again once loaded', async () => {
    vi.resetModules();
    const { selectNotificationsSubscribers } = await loadModule();
    const state = {
      notificationPermission: { value: new Success('token-123') },
      notificationsSubscribers: new Success('user-1'),
    } as unknown as RootState;

    expect(selectNotificationsSubscribers(state)).toStrictEqual(new Success('user-1'));
    expect(subscribeToDocument).not.toHaveBeenCalled();
  });
});
