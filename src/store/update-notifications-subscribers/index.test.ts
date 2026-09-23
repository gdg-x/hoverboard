import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteDoc, doc, setDoc, Timestamp } from 'firebase/firestore';
import reducer, { clearNotificationsSubscribers, updateNotificationsSubscribers } from '.';
import { dispatch } from '../dispatch';
import { queueSnackbar } from '../snackbars';
import { notifications } from '../../utils/data';

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();

  return {
    ...actual,
    deleteDoc: vi.fn(),
    doc: vi.fn(),
    getFirestore: vi.fn(),
    setDoc: vi.fn(),
    Timestamp: {
      now: vi.fn(),
    },
  };
});
vi.mock('../dispatch');

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
    const now = { seconds: 1 } as never;

    vi.spyOn(Timestamp, 'now').mockReturnValue(now);
    vi.mocked(doc).mockReturnValue('subscriber-doc' as never);
    vi.mocked(setDoc).mockResolvedValue(undefined as never);

    await updateNotificationsSubscribers('token-1');

    expect(doc).toHaveBeenCalledWith(undefined, 'notificationsSubscribers', 'token-1');
    expect(setDoc).toHaveBeenCalledWith('subscriber-doc', {
      value: true,
      updatedAt: now,
    });
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

    vi.mocked(doc).mockReturnValue('subscriber-doc' as never);
    vi.mocked(setDoc).mockRejectedValue(error);

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
  });

  it('deletes the subscriber token and queues a disabled toast', async () => {
    vi.mocked(doc).mockReturnValue('subscriber-doc' as never);
    vi.mocked(deleteDoc).mockResolvedValue(undefined as never);

    await clearNotificationsSubscribers('token-1');

    expect(doc).toHaveBeenCalledWith(undefined, 'notificationsSubscribers', 'token-1');
    expect(deleteDoc).toHaveBeenCalledWith('subscriber-doc');
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

    vi.mocked(doc).mockReturnValue('subscriber-doc' as never);
    vi.mocked(deleteDoc).mockRejectedValue(error);

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
  });
});
