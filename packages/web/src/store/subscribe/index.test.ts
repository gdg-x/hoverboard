import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import reducer, { resetSubscribed, subscribe } from '.';
import { saveSubscriber } from '../../db/subscribers';
import { dispatch } from '../dispatch';
import { queueSnackbar } from '../snackbars';
import { subscribeBlock } from '../../utils/data';

vi.mock('../../db/subscribers');
vi.mock('../dispatch');

describe('subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });

  it('handles pending, success, failure, and reset actions', () => {
    const error = new Error('failed');

    expect(reducer(new Initialized(), { type: 'subscribe/pending' })).toStrictEqual(new Pending());
    expect(
      reducer(new Initialized(), {
        type: 'subscribe/success',
        payload: true,
      }),
    ).toStrictEqual(new Success(true));
    expect(
      reducer(new Initialized(), {
        type: 'subscribe/failure',
        payload: error,
      }),
    ).toStrictEqual(new Failure(error));
    expect(reducer(new Success(true), { type: 'subscribe/reset' })).toStrictEqual(
      new Initialized(),
    );
  });

  it('stores the subscriber and queues a success toast', async () => {
    vi.mocked(saveSubscriber).mockResolvedValue(true);

    await subscribe({
      email: 'ada.lovelace+subscribe@example.com',
      firstFieldValue: 'Ada',
      secondFieldValue: 'Lovelace',
    });

    expect(saveSubscriber).toHaveBeenCalledWith({
      email: 'ada.lovelace+subscribe@example.com',
      firstFieldValue: 'Ada',
      secondFieldValue: 'Lovelace',
    });
    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'subscribe/pending' }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: 'subscribe/success' }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(3, queueSnackbar(subscribeBlock.toast));
  });

  it('dispatches failure when storing the subscriber fails', async () => {
    const error = new Error('write failed');

    vi.mocked(saveSubscriber).mockRejectedValue(error);

    await subscribe({ email: 'ada@example.com' });

    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'subscribe/pending' }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: 'subscribe/failure', payload: error }),
    );
  });

  it('dispatches reset when resetSubscribed is called', () => {
    resetSubscribed();

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'subscribe/reset' }));
  });
});
