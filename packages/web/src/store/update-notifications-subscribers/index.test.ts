import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import reducer, { clearNotificationsSubscribers, updateNotificationsSubscribers } from '.';
import {
  removeNotificationsSubscriber,
  saveNotificationsSubscriber,
} from '../../db/notifications-subscribers';
import { dispatch } from '../dispatch';
import { queueSnackbar } from '../snackbars';
import { notifications } from '../../utils/data';

vi.mock('../../db/notifications-subscribers');
vi.mock('../dispatch');
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

  it('handles pending, success, failure, and reset actions', () => {
    const error = new Error('failed');

    expect(
      reducer(new Initialized(), { type: 'updateNotificationsSubscribers/pending' }),
    ).toStrictEqual(new Pending());
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
      reducer(new Success('token-1'), {
        type: 'updateNotificationsSubscribers/reset',
      }),
    ).toStrictEqual(new Initialized());
  });

  it('stores the subscriber token and queues an enabled toast', async () => {
    vi.mocked(saveNotificationsSubscriber).mockResolvedValue(undefined);

    await updateNotificationsSubscribers('token-1');

    expect(saveNotificationsSubscriber).toHaveBeenCalledWith('token-1');
    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'updateNotificationsSubscribers/pending' }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: 'updateNotificationsSubscribers/success',
        payload: 'token-1',
      }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(3, queueSnackbar(notifications.generalEnabled));
  });

  it('dispatches failure when storing the subscriber token fails', async () => {
    const error = new Error('write failed');
    vi.mocked(saveNotificationsSubscriber).mockRejectedValue(error);

    await updateNotificationsSubscribers('token-1');

    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'updateNotificationsSubscribers/pending' }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: 'updateNotificationsSubscribers/failure',
        payload: error,
      }),
    );
    expect(queueSnackbar).not.toHaveBeenCalled();
  });

  it('deletes the subscriber token and queues a disabled toast', async () => {
    vi.mocked(removeNotificationsSubscriber).mockResolvedValue(undefined);

    await clearNotificationsSubscribers('token-1');

    expect(removeNotificationsSubscriber).toHaveBeenCalledWith('token-1');
    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'updateNotificationsSubscribers/pending' }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: 'updateNotificationsSubscribers/reset' }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(3, queueSnackbar(notifications.generalDisabled));
  });

  it('dispatches failure when deleting the subscriber token fails', async () => {
    const error = new Error('delete failed');
    vi.mocked(removeNotificationsSubscriber).mockRejectedValue(error);

    await clearNotificationsSubscribers('token-1');

    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'updateNotificationsSubscribers/pending' }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: 'updateNotificationsSubscribers/failure',
        payload: error,
      }),
    );
    expect(queueSnackbar).not.toHaveBeenCalled();
  });
});
