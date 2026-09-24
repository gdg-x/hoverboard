import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import reducer, {
  initialNotificationPermissionState,
  PROMPT_USER,
  requestNotificationPermission,
  unsupportedNotificationPermission,
} from '.';
import { getMessaging, getToken } from 'firebase/messaging';

vi.mock('firebase/messaging');

const setNotification = (
  permission: NotificationPermission,
  requestPermission = vi.fn().mockResolvedValue(permission),
) => {
  Object.defineProperty(globalThis, 'Notification', {
    configurable: true,
    value: {
      permission,
      requestPermission,
    },
  });

  return requestPermission;
};

describe('notificationPermission', () => {
  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(
      initialNotificationPermissionState,
    );
  });

  it('marks notifications as unsupported directly', () => {
    expect(
      reducer(initialNotificationPermissionState, unsupportedNotificationPermission()),
    ).toStrictEqual({
      value: new Failure(new Error('unsupported')),
    });
  });

  it('sets Pending while the request is in flight', () => {
    expect(
      reducer(
        initialNotificationPermissionState,
        requestNotificationPermission.pending('request-id', PROMPT_USER.YES),
      ),
    ).toStrictEqual({
      value: new Pending(),
    });
  });

  it('returns to Initialized when permission remains default', async () => {
    setNotification('default');

    const action = await requestNotificationPermission(PROMPT_USER.NO)(vi.fn(), vi.fn(), undefined);

    expect(action).toMatchObject({
      type: requestNotificationPermission.fulfilled.type,
      payload: undefined,
    });
    expect(reducer(initialNotificationPermissionState, action)).toStrictEqual({
      value: new Initialized(),
    });
  });

  it('requests permission and stores the token when granted', async () => {
    const requestPermission = setNotification('default', vi.fn().mockResolvedValue('granted'));
    vi.mocked(getMessaging).mockReturnValue({} as never);
    vi.mocked(getToken).mockResolvedValue('token-123');

    const action = await requestNotificationPermission(PROMPT_USER.YES)(
      vi.fn(),
      vi.fn(),
      undefined,
    );

    expect(requestPermission).toHaveBeenCalled();
    expect(getMessaging).toHaveBeenCalled();
    expect(getToken).toHaveBeenCalled();
    expect(reducer(initialNotificationPermissionState, action)).toStrictEqual({
      value: new Success('token-123'),
    });
  });

  it('stores a denied error when permission is rejected', async () => {
    setNotification('denied');

    const action = await requestNotificationPermission(PROMPT_USER.NO)(vi.fn(), vi.fn(), undefined);

    expect(action.type).toBe(requestNotificationPermission.rejected.type);
    expect(reducer(initialNotificationPermissionState, action)).toStrictEqual({
      value: new Failure(new Error('denied')),
    });
  });

  it('stores an unsupported error when token retrieval fails', async () => {
    setNotification('granted');
    vi.mocked(getMessaging).mockReturnValue({} as never);
    vi.mocked(getToken).mockRejectedValue(new Error('nope'));

    const action = await requestNotificationPermission(PROMPT_USER.NO)(vi.fn(), vi.fn(), undefined);

    expect(action.type).toBe(requestNotificationPermission.rejected.type);
    expect(reducer(initialNotificationPermissionState, action)).toStrictEqual({
      value: new Failure(new Error('unsupported')),
    });
  });
});
