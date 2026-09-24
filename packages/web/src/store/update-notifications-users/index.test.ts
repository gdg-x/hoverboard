import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import reducer, { removeNotificationsUsers, updateNotificationsUsers } from '.';
import { saveNotificationsUsers } from '../../db/notifications-users';
import { dispatch, getState } from '../dispatch';
import { queueSnackbar } from '../snackbars';
import { notifications } from '../../utils/data';
import type { RootState } from '..';

vi.mock('../../db/notifications-users');
vi.mock('../dispatch');
vi.mock('../snackbars', () => ({
  queueSnackbar: vi.fn((label: string) => ({
    type: 'snackbars/queueSnackbar',
    payload: label,
  })),
}));

describe('update-notifications-users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });

  it('handles pending, success, and failure actions', () => {
    const error = new Error('failed');

    expect(reducer(new Initialized(), { type: 'updateNotificationsUsers/pending' })).toStrictEqual(
      new Pending(),
    );
    expect(
      reducer(new Initialized(), {
        type: 'updateNotificationsUsers/success',
        payload: 'user-1',
      }),
    ).toStrictEqual(new Success('user-1'));
    expect(
      reducer(new Initialized(), {
        type: 'updateNotificationsUsers/failure',
        payload: error,
      }),
    ).toStrictEqual(new Failure(error));
  });

  it('adds the new token to the stored user tokens and queues an enabled toast', async () => {
    vi.mocked(getState).mockReturnValue({
      notificationsUsers: new Success({
        id: 'user-1',
        tokens: {
          existing: true,
        },
      }),
    } as unknown as RootState);
    vi.mocked(saveNotificationsUsers).mockResolvedValue(undefined);

    await updateNotificationsUsers('user-1', 'new-token');

    expect(saveNotificationsUsers).toHaveBeenCalledWith('user-1', {
      tokens: {
        existing: true,
        'new-token': true,
      },
    });
    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'updateNotificationsUsers/pending' }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: 'updateNotificationsUsers/success', payload: 'user-1' }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(3, queueSnackbar(notifications.myScheduleEnabled));
  });

  it('dispatches failure when storing user tokens fails', async () => {
    const error = new Error('write failed');
    vi.mocked(getState).mockReturnValue({
      notificationsUsers: new Success({
        id: 'user-1',
        tokens: {},
      }),
    } as unknown as RootState);
    vi.mocked(saveNotificationsUsers).mockRejectedValue(error);

    await updateNotificationsUsers('user-1', 'new-token');

    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'updateNotificationsUsers/pending' }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: 'updateNotificationsUsers/failure',
        payload: error,
      }),
    );
    expect(queueSnackbar).not.toHaveBeenCalled();
  });

  it('removes the token from the stored user tokens and queues a disabled toast', async () => {
    vi.mocked(getState).mockReturnValue({
      notificationsUsers: new Success({
        id: 'user-1',
        tokens: {
          existing: true,
          'remove-me': true,
        },
      }),
    } as unknown as RootState);
    vi.mocked(saveNotificationsUsers).mockResolvedValue(undefined);

    await removeNotificationsUsers('user-1', 'remove-me');

    expect(saveNotificationsUsers).toHaveBeenCalledWith('user-1', {
      tokens: {
        existing: true,
      },
    });
    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'updateNotificationsUsers/pending' }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: 'updateNotificationsUsers/success', payload: 'user-1' }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(3, queueSnackbar(notifications.myScheduleDisabled));
  });

  it('dispatches failure when removing user tokens fails', async () => {
    const error = new Error('remove failed');
    vi.mocked(getState).mockReturnValue({
      notificationsUsers: new Success({
        id: 'user-1',
        tokens: { 'remove-me': true },
      }),
    } as unknown as RootState);
    vi.mocked(saveNotificationsUsers).mockRejectedValue(error);

    await removeNotificationsUsers('user-1', 'remove-me');

    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'updateNotificationsUsers/pending' }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: 'updateNotificationsUsers/failure',
        payload: error,
      }),
    );
    expect(queueSnackbar).not.toHaveBeenCalled();
  });
});
