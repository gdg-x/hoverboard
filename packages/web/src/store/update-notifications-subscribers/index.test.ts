import { Failure, Initialized, Success } from '@abraham/remotedata';
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import reducer, { clearNotificationsSubscribers, updateNotificationsSubscribers } from '.';
import {
  removeNotificationsSubscriber,
  saveNotificationsSubscriber,
} from '../../db/notifications-subscribers';
import { dispatch } from '../dispatch';
import { queueSnackbar } from '../snackbars';
import { canWriteNow } from '../sync';

vi.mock('../../db/notifications-subscribers');
vi.mock('../dispatch');
vi.mock('../sync', () => ({ canWriteNow: vi.fn(() => true) }));
vi.mock('../snackbars', () => ({
  queueSnackbar: vi.fn((label: string) => ({
    type: 'snackbars/queueSnackbar',
    payload: label,
  })),
}));

describe('update-notifications-subscribers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });

  it('handles success, failure, and reset actions', () => {
    const error = new Error('failed');

    expect(
      reducer(new Initialized(), {
        type: 'updateNotificationsSubscribers/success',
        payload: 'token-1',
      }),
    ).toStrictEqual(new Success('token-1'));
    expect(
      reducer(new Initialized(), {
        type: 'updateNotificationsSubscribers/failure',
        payload: error,
      }),
    ).toStrictEqual(new Failure(error));
    expect(
      reducer(new Success('token-1'), { type: 'updateNotificationsSubscribers/reset' }),
    ).toStrictEqual(new Initialized());
  });

  it('stores the token and confirms without waiting for the server', () => {
    updateNotificationsSubscribers('token-1');

    expect(saveNotificationsSubscriber).toHaveBeenCalledWith('token-1', expect.any(Function));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'updateNotificationsSubscribers/success',
        payload: 'token-1',
      }),
    );
    expect(queueSnackbar).toHaveBeenCalledWith('General notifications enabled');
  });

  it('deletes the token and confirms without waiting for the server', () => {
    clearNotificationsSubscribers('token-1');

    expect(removeNotificationsSubscriber).toHaveBeenCalledWith('token-1', expect.any(Function));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'updateNotificationsSubscribers/reset' }),
    );
    expect(queueSnackbar).toHaveBeenCalledWith('General notifications disabled');
  });

  it('dispatches failure when the server refuses the token', () => {
    const error = new Error('permission-denied');
    vi.mocked(removeNotificationsSubscriber).mockImplementation((_token, onRejected) =>
      onRejected(error),
    );

    clearNotificationsSubscribers('token-1');

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'updateNotificationsSubscribers/failure', payload: error }),
    );
  });

  it('needs the network, since the token belongs to the device, not an account', () => {
    vi.mocked(canWriteNow).mockReturnValue(false);
    onTestFinished(() => {
      vi.mocked(canWriteNow).mockReturnValue(true);
    });

    updateNotificationsSubscribers('token-1');
    clearNotificationsSubscribers('token-1');

    expect(saveNotificationsSubscriber).not.toHaveBeenCalled();
    expect(removeNotificationsSubscriber).not.toHaveBeenCalled();
  });
});
