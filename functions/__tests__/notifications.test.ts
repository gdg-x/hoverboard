import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import * as functions from 'firebase-functions';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendGeneralNotification } from '../src/notifications';

vi.mock('firebase-admin/firestore');
vi.mock('firebase-admin/messaging');

const mockSnapshot = (message?: Record<string, unknown>) => ({
  data: () => message,
});

const setupNotificationMocks = ({
  configExists = true,
  notificationsConfig = {},
  results = [],
  tokens = [],
}: {
  configExists?: boolean;
  notificationsConfig?: Record<string, unknown>;
  results?: Array<{ error?: { code: string } }>;
  tokens?: string[];
}) => {
  const deletedTokens: string[] = [];
  const sendToDevice = vi.fn().mockResolvedValue({ results });
  const collection = vi.fn().mockImplementation((collectionName: string) => {
    if (collectionName === 'notificationsSubscribers') {
      return {
        get: vi.fn().mockResolvedValue({
          docs: tokens.map((token) => ({ id: token })),
        }),
        doc: vi.fn().mockImplementation((token: string) => ({
          delete: vi.fn().mockImplementation(() => {
            deletedTokens.push(token);
            return Promise.resolve();
          }),
        })),
      };
    }

    if (collectionName === 'config') {
      return {
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            exists: configExists,
            data: () => notificationsConfig,
          }),
        }),
      };
    }

    throw new Error(`Unexpected collection: ${collectionName}`);
  });

  vi.mocked(getFirestore).mockReturnValue({ collection } as never);
  vi.mocked(getMessaging).mockReturnValue({ sendToDevice } as never);

  return { deletedTokens, sendToDevice };
};

describe('sendGeneralNotification', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('returns early when the created notification has no data', async () => {
    await sendGeneralNotification.run(
      mockSnapshot(undefined) as never,
      { params: { timestamp: '12345' } } as never,
    );

    expect(getFirestore).not.toHaveBeenCalled();
    expect(getMessaging).not.toHaveBeenCalled();
  });

  it('logs and returns when there are no subscriber tokens', async () => {
    setupNotificationMocks({
      notificationsConfig: { icon: '/default-icon.png' },
      tokens: [],
    });
    const logSpy = vi.spyOn(functions.logger, 'log').mockImplementation(() => undefined);

    await sendGeneralNotification.run(
      mockSnapshot({ title: 'Hello', body: 'World' }) as never,
      { params: { timestamp: '12345' } } as never,
    );

    expect(logSpy).toHaveBeenCalledWith('There are no notification tokens to send to.');
    expect(getMessaging).not.toHaveBeenCalled();
  });

  it('uses the config icon fallback and includes the message path when present', async () => {
    const { sendToDevice } = setupNotificationMocks({
      notificationsConfig: { icon: '/default-icon.png' },
      results: [{}, {}],
      tokens: ['token-1', 'token-2'],
    });

    await sendGeneralNotification.run(
      mockSnapshot({
        title: 'Schedule update',
        body: 'Agenda changed',
        path: '/schedule/day-1',
      }) as never,
      { params: { timestamp: '12345' } } as never,
    );

    expect(sendToDevice).toHaveBeenCalledWith(['token-1', 'token-2'], {
      data: {
        title: 'Schedule update',
        body: 'Agenda changed',
        icon: '/default-icon.png',
        path: '/schedule/day-1',
      },
    });
  });

  it('uses the message icon and omits path when the message does not include one', async () => {
    const { sendToDevice } = setupNotificationMocks({
      notificationsConfig: { icon: '/default-icon.png' },
      results: [{}],
      tokens: ['token-1'],
    });

    await sendGeneralNotification.run(
      mockSnapshot({
        title: 'Welcome',
        body: 'See you soon',
        icon: '/custom-icon.png',
      }) as never,
      { params: { timestamp: '12345' } } as never,
    );

    expect(sendToDevice).toHaveBeenCalledWith(['token-1'], {
      data: {
        title: 'Welcome',
        body: 'See you soon',
        icon: '/custom-icon.png',
      },
    });
  });

  it('removes invalid registration tokens after messaging failures', async () => {
    const { deletedTokens, sendToDevice } = setupNotificationMocks({
      notificationsConfig: { icon: '/default-icon.png' },
      results: [
        {},
        { error: { code: 'messaging/invalid-registration-token' } },
        { error: { code: 'messaging/registration-token-not-registered' } },
        { error: { code: 'messaging/internal-error' } },
      ],
      tokens: ['token-1', 'token-2', 'token-3', 'token-4'],
    });
    const errorSpy = vi.spyOn(functions.logger, 'error').mockImplementation(() => undefined);

    await sendGeneralNotification.run(
      mockSnapshot({
        title: 'Reminder',
        body: 'Talk starts soon',
      }) as never,
      { params: { timestamp: '12345' } } as never,
    );

    expect(sendToDevice).toHaveBeenCalledTimes(1);
    expect(deletedTokens).toStrictEqual(['token-2', 'token-3']);
    expect(errorSpy).toHaveBeenCalledTimes(3);
  });
});
