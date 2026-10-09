import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import * as logger from 'firebase-functions/logger';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendGeneralNotification } from '../../src/triggers/notifications';
import { expectNoPersonalDataLogged } from '../personal-data';

vi.mock('firebase-admin/firestore');
vi.mock('firebase-admin/messaging');
vi.mock('firebase-functions/logger');

const mockSnapshot = (message?: Record<string, unknown>) => ({
  data: () => message,
});

const setupNotificationMocks = ({
  configExists = true,
  notificationsConfig = {},
  responses = [],
  tokens = [],
}: {
  configExists?: boolean;
  notificationsConfig?: Record<string, unknown>;
  responses?: Array<{ success: boolean; error?: { code: string } }>;
  tokens?: string[];
}) => {
  const deletedTokens: string[] = [];
  const sendEachForMulticast = vi.fn().mockResolvedValue({ responses });
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
  vi.mocked(getMessaging).mockReturnValue({ sendEachForMulticast } as never);

  return { deletedTokens, sendEachForMulticast };
};

describe('sendGeneralNotification', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  // Runs before the restore above, which removes the spies' calls.
  afterEach(expectNoPersonalDataLogged);

  it('returns early when the created notification has no data', async () => {
    await sendGeneralNotification.run({
      data: mockSnapshot(undefined),
      params: { timestamp: '12345' },
    } as never);

    expect(getFirestore).not.toHaveBeenCalled();
    expect(getMessaging).not.toHaveBeenCalled();
  });

  it('logs an error and returns when the notification has no title or body', async () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);

    await sendGeneralNotification.run({
      data: mockSnapshot({ body: 'World' }),
      params: { timestamp: '12345' },
    } as never);

    expect(errorSpy).toHaveBeenCalledWith(
      'Notification 12345 needs a `title` and a `body` string.',
    );
    expect(getFirestore).not.toHaveBeenCalled();
    expect(getMessaging).not.toHaveBeenCalled();
  });

  it('logs and returns when there are no subscriber tokens', async () => {
    setupNotificationMocks({
      notificationsConfig: { icon: '/default-icon.png' },
      tokens: [],
    });
    const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => undefined);

    await sendGeneralNotification.run({
      data: mockSnapshot({ title: 'Hello', body: 'World' }),
      params: { timestamp: '12345' },
    } as never);

    expect(logSpy).toHaveBeenCalledWith('There are no notification tokens to send to.');
    expect(getMessaging).not.toHaveBeenCalled();
  });

  it('uses the config icon fallback and includes the message path when present', async () => {
    const { sendEachForMulticast } = setupNotificationMocks({
      notificationsConfig: { icon: '/default-icon.png' },
      responses: [{ success: true }, { success: true }],
      tokens: ['fid0000000000000000001', 'fid0000000000000000002'],
    });

    await sendGeneralNotification.run({
      data: mockSnapshot({
        title: 'Schedule update',
        body: 'Agenda changed',
        path: '/schedule/day-1',
      }),
      params: { timestamp: '12345' },
    } as never);

    expect(sendEachForMulticast).toHaveBeenCalledWith({
      fids: ['fid0000000000000000001', 'fid0000000000000000002'],
      data: {
        title: 'Schedule update',
        body: 'Agenda changed',
        icon: '/default-icon.png',
        path: '/schedule/day-1',
      },
    });
  });

  it('uses the message icon and omits path when the message does not include one', async () => {
    const { sendEachForMulticast } = setupNotificationMocks({
      notificationsConfig: { icon: '/default-icon.png' },
      responses: [{ success: true }],
      tokens: ['fid0000000000000000001'],
    });

    await sendGeneralNotification.run({
      data: mockSnapshot({
        title: 'Welcome',
        body: 'See you soon',
        icon: '/custom-icon.png',
      }),
      params: { timestamp: '12345' },
    } as never);

    expect(sendEachForMulticast).toHaveBeenCalledWith({
      fids: ['fid0000000000000000001'],
      data: {
        title: 'Welcome',
        body: 'See you soon',
        icon: '/custom-icon.png',
      },
    });
  });

  it('sends to subscribers in batches of at most 500 tokens', async () => {
    const tokens = Array.from(
      { length: 1001 },
      (_, index) => `fid${String(index).padStart(19, '0')}`,
    );
    const { sendEachForMulticast } = setupNotificationMocks({ responses: [], tokens });

    await sendGeneralNotification.run({
      data: mockSnapshot({ title: 'Reminder', body: 'Talk starts soon' }),
      params: { timestamp: '12345' },
    } as never);

    const batchSizes = sendEachForMulticast.mock.calls.map(([message]) => message.fids.length);
    expect(batchSizes).toStrictEqual([500, 500, 1]);
  });

  it('removes invalid registration tokens after messaging failures', async () => {
    const { deletedTokens, sendEachForMulticast } = setupNotificationMocks({
      notificationsConfig: { icon: '/default-icon.png' },
      responses: [
        { success: true },
        { success: false, error: { code: 'messaging/invalid-registration-token' } },
        { success: false, error: { code: 'messaging/registration-token-not-registered' } },
        { success: false, error: { code: 'messaging/internal-error' } },
      ],
      tokens: [
        'fid0000000000000000001',
        'fid0000000000000000002',
        'fid0000000000000000003',
        'fid0000000000000000004',
      ],
    });
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);

    await sendGeneralNotification.run({
      data: mockSnapshot({
        title: 'Reminder',
        body: 'Talk starts soon',
      }),
      params: { timestamp: '12345' },
    } as never);

    expect(sendEachForMulticast).toHaveBeenCalledTimes(1);
    expect(deletedTokens).toStrictEqual(['fid0000000000000000002', 'fid0000000000000000003']);
    expect(errorSpy).toHaveBeenCalledTimes(3);
  });
});
