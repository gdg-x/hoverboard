import { Failure, Initialized, Success } from '@abraham/remotedata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import reducer, { resetSubscribed, subscribe } from '.';
import { saveSubscriber } from '../../db/subscribers';
import { dispatch } from '../dispatch';
import { queueSnackbar } from '../snackbars';
import { canWriteNow } from '../sync';

vi.mock('../../db/subscribers');
vi.mock('../dispatch');
vi.mock('../sync', () => ({ canWriteNow: vi.fn(() => true) }));

describe('subscribe', () => {
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

  it('stores the subscriber and thanks the visitor without waiting for the server', () => {
    subscribe({
      email: 'ada.lovelace+subscribe@example.com',
      firstFieldValue: 'Ada',
      secondFieldValue: 'Lovelace',
    });

    expect(saveSubscriber).toHaveBeenCalledWith(
      {
        email: 'ada.lovelace+subscribe@example.com',
        firstFieldValue: 'Ada',
        secondFieldValue: 'Lovelace',
      },
      expect.any(Function),
    );
    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'subscribe/success' }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(2, queueSnackbar('Successfully subscribed!'));
  });

  it('dispatches failure when the server refuses the subscriber', () => {
    const error = new Error('permission-denied');
    vi.mocked(saveSubscriber).mockImplementation((_data, onRejected) => onRejected(error));

    subscribe({ email: 'ada@example.com' });

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'subscribe/failure', payload: error }),
    );
  });

  it('needs the network, since the visitor has no account to sync it later', () => {
    vi.mocked(canWriteNow).mockReturnValueOnce(false);

    subscribe({ email: 'ada@example.com' });

    expect(saveSubscriber).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'subscribe/failure' }));
  });

  it('dispatches reset when resetSubscribed is called', () => {
    resetSubscribed();

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'subscribe/reset' }));
  });
});
