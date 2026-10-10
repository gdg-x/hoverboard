import { Failure, Initialized, Success } from '@abraham/remotedata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import reducer, { removeNotificationsUsers, updateNotificationsUsers } from '.';
import { saveNotificationsUsers } from '../../db/notifications-users';
import { dispatch, getState } from '../dispatch';
import { queueSnackbar } from '../snackbars';
import type { RootState } from '..';

vi.mock('../../db/notifications-users');
vi.mock('../dispatch');
vi.mock('../snackbars', () => ({
  queueSnackbar: vi.fn((label: string) => ({
    type: 'snackbars/queueSnackbar',
    payload: label,
  })),
}));

const withTokens = (tokens: Record<string, true>) =>
  vi.mocked(getState).mockReturnValue({
    notificationsUsers: new Success({ id: 'user-1', tokens }),
  } as unknown as RootState);

describe('update-notifications-users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });

  it('handles success and failure actions', () => {
    const error = new Error('failed');

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

  it('adds the token and confirms without waiting for the server', () => {
    withTokens({ 'token-1': true });

    updateNotificationsUsers('user-1', 'token-2');

    expect(saveNotificationsUsers).toHaveBeenCalledWith(
      'user-1',
      { tokens: { 'token-1': true, 'token-2': true } },
      expect.any(Function),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'updateNotificationsUsers/success', payload: 'user-1' }),
    );
    expect(queueSnackbar).toHaveBeenCalledWith('My Schedule notifications enabled');
  });

  it('removes the token and confirms without waiting for the server', () => {
    withTokens({ 'token-1': true, 'token-2': true });

    removeNotificationsUsers('user-1', 'token-2');

    expect(saveNotificationsUsers).toHaveBeenCalledWith(
      'user-1',
      { tokens: { 'token-1': true } },
      expect.any(Function),
    );
    expect(queueSnackbar).toHaveBeenCalledWith('My Schedule notifications disabled');
  });

  it('dispatches failure when the server refuses the tokens', () => {
    const error = new Error('permission-denied');
    withTokens({});
    vi.mocked(saveNotificationsUsers).mockImplementation((_uid, _data, onRejected) =>
      onRejected(error),
    );

    updateNotificationsUsers('user-1', 'token-1');

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'updateNotificationsUsers/failure', payload: error }),
    );
  });
});
