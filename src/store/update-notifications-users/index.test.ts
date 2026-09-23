import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { doc, setDoc } from 'firebase/firestore';
import reducer, { removeNotificationsUsers, updateNotificationsUsers } from '.';
import { dispatch, getState } from '../dispatch';
import { queueSnackbar } from '../snackbars';
import { notifications } from '../../utils/data';
import type { RootState } from '..';

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();

  return {
    ...actual,
    doc: vi.fn(),
    getFirestore: vi.fn(),
    setDoc: vi.fn(),
  };
});
vi.mock('../dispatch');

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
    vi.mocked(doc).mockReturnValue('notifications-user-doc' as never);
    vi.mocked(setDoc).mockResolvedValue(undefined as never);

    await updateNotificationsUsers('user-1', 'new-token');

    expect(doc).toHaveBeenCalledWith(undefined, 'notificationsUsers', 'user-1');
    expect(setDoc).toHaveBeenCalledWith('notifications-user-doc', {
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

  it('starts from an empty token set when notifications users have not loaded yet', async () => {
    vi.mocked(getState).mockReturnValue({
      notificationsUsers: new Initialized(),
    } as unknown as RootState);
    vi.mocked(doc).mockReturnValue('notifications-user-doc' as never);
    vi.mocked(setDoc).mockResolvedValue(undefined as never);

    await updateNotificationsUsers('user-1', 'new-token');

    expect(setDoc).toHaveBeenCalledWith('notifications-user-doc', {
      tokens: {
        'new-token': true,
      },
    });
  });

  it('removes only the requested token and queues a disabled toast', async () => {
    vi.mocked(getState).mockReturnValue({
      notificationsUsers: new Success({
        id: 'user-1',
        tokens: {
          keep: true,
          remove: true,
        },
      }),
    } as unknown as RootState);
    vi.mocked(doc).mockReturnValue('notifications-user-doc' as never);
    vi.mocked(setDoc).mockResolvedValue(undefined as never);

    await removeNotificationsUsers('user-1', 'remove');

    expect(setDoc).toHaveBeenCalledWith('notifications-user-doc', {
      tokens: {
        keep: true,
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

  it('dispatches failure when updating user tokens fails', async () => {
    const error = new Error('write failed');

    vi.mocked(getState).mockReturnValue({
      notificationsUsers: new Success({
        id: 'user-1',
        tokens: {},
      }),
    } as unknown as RootState);
    vi.mocked(doc).mockReturnValue('notifications-user-doc' as never);
    vi.mocked(setDoc).mockRejectedValue(error);

    await updateNotificationsUsers('user-1', 'new-token');

    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'updateNotificationsUsers/pending' }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: 'updateNotificationsUsers/failure', payload: error }),
    );
  });

  it('dispatches failure when removing user tokens fails', async () => {
    const error = new Error('write failed');

    vi.mocked(getState).mockReturnValue({
      notificationsUsers: new Success({
        id: 'user-1',
        tokens: {
          remove: true,
        },
      }),
    } as unknown as RootState);
    vi.mocked(doc).mockReturnValue('notifications-user-doc' as never);
    vi.mocked(setDoc).mockRejectedValue(error);

    await removeNotificationsUsers('user-1', 'remove');

    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'updateNotificationsUsers/pending' }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: 'updateNotificationsUsers/failure', payload: error }),
    );
  });
});
