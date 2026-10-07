import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import * as logger from 'firebase-functions/logger';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSiteConfig } from '../../src/site-config';
import { scheduleNotifications } from '../../src/triggers/schedule-notifications';

vi.mock('firebase-admin/firestore');
vi.mock('firebase-admin/messaging');
vi.mock('firebase-functions/logger');
vi.mock('../../src/site-config', () => ({ getSiteConfig: vi.fn() }));

const MOCK_TIME = new Date('2025-06-22T14:30:00.000Z');

const createDocSnapshot = (data: Record<string, unknown> | undefined) => ({
  exists: data !== undefined,
  data: () => data,
});

const createQuerySnapshot = (docs: Array<{ id: string; data: Record<string, unknown> }>) => ({
  docs: docs.map((doc) => ({
    id: doc.id,
    data: () => doc.data,
  })),
});

const mockFirestore = ({
  notificationsConfig,
  scheduleDocs = [],
  featuredSessionDocs = [],
  sessionDocs = {},
  notificationsUsersDocs = {},
  claimedNotifications = [],
}: {
  notificationsConfig?: Record<string, unknown>;
  scheduleDocs?: Array<{ id: string; data: Record<string, unknown> }>;
  featuredSessionDocs?: Array<{ id: string; data: Record<string, unknown> }>;
  sessionDocs?: Record<string, Record<string, unknown>>;
  notificationsUsersDocs?: Record<string, Record<string, unknown>>;
  claimedNotifications?: string[];
}) => {
  const claimed = new Set(claimedNotifications);
  const released: string[] = [];
  const transactionGet = vi.fn(async (ref: { id: string }) =>
    createDocSnapshot(notificationsUsersDocs[ref.id]),
  );
  const transactionSet = vi.fn();
  const runTransaction = vi.fn(async (updateFn: (transaction: unknown) => Promise<unknown>) =>
    updateFn({
      get: transactionGet,
      set: transactionSet,
    }),
  );

  vi.mocked(getFirestore).mockReturnValue({
    collection: vi.fn().mockImplementation((collectionName: string) => {
      switch (collectionName) {
        case 'config':
          return {
            doc: vi.fn().mockImplementation((docId: string) => ({
              id: docId,
              get: vi
                .fn()
                .mockResolvedValue(
                  createDocSnapshot(docId === 'notifications' ? notificationsConfig : undefined),
                ),
            })),
          };
        case 'schedule':
          return {
            get: vi.fn().mockResolvedValue(createQuerySnapshot(scheduleDocs)),
          };
        case 'featuredSessions':
          return {
            get: vi.fn().mockResolvedValue(createQuerySnapshot(featuredSessionDocs)),
          };
        case 'sessions':
          return {
            doc: vi.fn().mockImplementation((docId: string) => ({
              id: docId,
              get: vi.fn().mockResolvedValue(createDocSnapshot(sessionDocs[docId])),
            })),
          };
        case 'sentNotifications':
          return {
            doc: vi.fn().mockImplementation((docId: string) => ({
              create: vi.fn().mockImplementation(async () => {
                if (claimed.has(docId)) throw Object.assign(new Error('exists'), { code: 6 });
                claimed.add(docId);
              }),
              delete: vi.fn().mockImplementation(async () => {
                claimed.delete(docId);
                released.push(docId);
              }),
            })),
          };
        case 'notificationsUsers':
          return {
            doc: vi.fn().mockImplementation((docId: string) => ({
              id: docId,
              get: vi.fn().mockResolvedValue(createDocSnapshot(notificationsUsersDocs[docId])),
            })),
          };
        default:
          throw new Error(`Unexpected collection: ${collectionName}`);
      }
    }),
    runTransaction,
  } as never);

  return { runTransaction, transactionGet, transactionSet, claimed, released };
};

const mockMessaging = (responses: Array<Record<string, unknown>> = [{ success: true }]) => {
  const sendEachForMulticast = vi.fn().mockResolvedValue({ responses });

  vi.mocked(getMessaging).mockReturnValue({
    sendEachForMulticast,
  } as never);

  return { sendEachForMulticast };
};

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(MOCK_TIME);
});

afterAll(() => {
  vi.useRealTimers();
});

describe('scheduleNotifications', () => {
  beforeEach(() => {
    vi.mocked(getFirestore).mockReset();
    vi.mocked(getMessaging).mockReset();
    vi.mocked(getSiteConfig).mockReturnValue({ features: {}, timeZone: 'UTC' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends reminders without an icon when config/notifications is missing', async () => {
    mockFirestore({
      scheduleDocs: upcomingSessionSchedule(['session-1']),
      featuredSessionDocs: [{ id: 'user-1', data: { 'session-1': true } }],
      sessionDocs: { 'session-1': { title: 'Keynote' } },
      notificationsUsersDocs: { 'user-1': { tokens: { fid0000000000000000001: true } } },
    });
    const { sendEachForMulticast } = mockMessaging();

    await scheduleNotifications.run(undefined as never);

    expect(sendEachForMulticast).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ icon: '' }) }),
    );
  });

  it('finds today in the event time zone', async () => {
    // 14:30 UTC is 02:30 the next day in Auckland.
    vi.mocked(getSiteConfig).mockReturnValue({ features: {}, timeZone: 'Pacific/Auckland' });
    mockFirestore({ scheduleDocs: [{ id: '2025-06-22', data: { timeslots: [] } }] });
    mockMessaging();
    const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => undefined);

    await scheduleNotifications.run(undefined as never);

    expect(logSpy).toHaveBeenCalledWith('2025-06-23', 'was not found in the schedule');
  });

  it('reads session start times in the event time zone', async () => {
    // 14:30 UTC is 17:30 in Kyiv, so a session at 17:40 starts in 10 minutes.
    vi.mocked(getSiteConfig).mockReturnValue({ features: {}, timeZone: 'Europe/Kyiv' });
    mockFirestore({
      scheduleDocs: [
        {
          id: '2025-06-22',
          data: { timeslots: [{ startTime: '17:40', sessions: [{ items: ['session-1'] }] }] },
        },
      ],
      featuredSessionDocs: [{ id: 'user-1', data: { 'session-1': true } }],
      sessionDocs: { 'session-1': { title: 'Keynote' } },
      notificationsUsersDocs: { 'user-1': { tokens: { fid0000000000000000001: true } } },
    });
    const { sendEachForMulticast } = mockMessaging();

    await scheduleNotifications.run(undefined as never);

    expect(sendEachForMulticast).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ body: 'Starts in 10 minutes' }) }),
    );
  });

  it('logs and exits when today is missing from the schedule', async () => {
    mockFirestore({
      notificationsConfig: { icon: 'https://example.com/icon.png' },
      scheduleDocs: [{ id: '2025-06-23', data: { timeslots: [] } }],
    });
    const { sendEachForMulticast } = mockMessaging();
    const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => undefined);

    await scheduleNotifications.run(undefined as never);

    expect(logSpy).toHaveBeenCalledWith('2025-06-22', 'was not found in the schedule');
    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('does not send notifications when no timeslots are currently upcoming', async () => {
    mockFirestore({
      notificationsConfig: { icon: 'https://example.com/icon.png' },
      scheduleDocs: [
        {
          id: '2025-06-22',
          data: {
            timeslots: [{ startTime: '15:00', sessions: [{ items: ['session-1'] }] }],
          },
        },
      ],
      featuredSessionDocs: [{ id: 'user-1', data: { 'session-1': true } }],
      sessionDocs: { 'session-1': { title: 'Keynote' } },
      notificationsUsersDocs: { 'user-1': { tokens: { fid0000000000000000001: true } } },
    });
    const { sendEachForMulticast } = mockMessaging();
    const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => undefined);

    await scheduleNotifications.run(undefined as never);

    expect(sendEachForMulticast).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('logs upcoming sessions when nobody has featured them', async () => {
    mockFirestore({
      notificationsConfig: { icon: 'https://example.com/icon.png' },
      scheduleDocs: [
        {
          id: '2025-06-22',
          data: {
            timeslots: [{ startTime: '14:40', sessions: [{ items: ['session-1'] }] }],
          },
        },
      ],
      featuredSessionDocs: [{ id: 'user-1', data: { 'session-2': true } }],
      sessionDocs: { 'session-1': { title: 'Keynote' } },
    });
    const { sendEachForMulticast } = mockMessaging();
    const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => undefined);

    await scheduleNotifications.run(undefined as never);

    expect(logSpy).toHaveBeenCalledWith('Upcoming sessions', ['session-1']);
    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });

  const upcomingSessionSchedule = (items: string[]) => [
    {
      id: '2025-06-22',
      data: { timeslots: [{ startTime: '14:40', sessions: [{ items }] }] },
    },
  ];

  it('sends a push notification to the device tokens of users who featured the session', async () => {
    mockFirestore({
      notificationsConfig: { icon: 'https://example.com/icon.png' },
      scheduleDocs: upcomingSessionSchedule(['session-1']),
      featuredSessionDocs: [
        { id: 'user-1', data: { 'session-1': true } },
        { id: 'user-2', data: { 'session-1': true } },
        { id: 'user-3', data: { 'session-2': true } },
      ],
      sessionDocs: { 'session-1': { title: 'Keynote' } },
      notificationsUsersDocs: {
        'user-1': { tokens: { fid0000000000000000001: true, fid0000000000000000002: true } },
        'user-2': { tokens: { fid0000000000000000003: true } },
      },
    });
    const { sendEachForMulticast } = mockMessaging();

    await scheduleNotifications.run(undefined as never);

    expect(sendEachForMulticast).toHaveBeenCalledTimes(1);
    expect(sendEachForMulticast).toHaveBeenCalledWith({
      fids: ['fid0000000000000000001', 'fid0000000000000000002', 'fid0000000000000000003'],
      data: {
        title: 'Keynote',
        body: 'Starts in 10 minutes',
        icon: 'https://example.com/icon.png',
        path: '/sessions/session-1',
      },
    });
  });

  it('does not call messaging when the featuring users have no device tokens', async () => {
    mockFirestore({
      scheduleDocs: upcomingSessionSchedule(['session-1']),
      featuredSessionDocs: [{ id: 'user-1', data: { 'session-1': true } }],
      sessionDocs: { 'session-1': { title: 'Keynote' } },
      notificationsUsersDocs: { 'user-1': { tokens: {} } },
    });
    const { sendEachForMulticast } = mockMessaging();

    await scheduleNotifications.run(undefined as never);

    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('waits for every session before resolving', async () => {
    mockFirestore({
      scheduleDocs: upcomingSessionSchedule(['session-1', 'session-2']),
      featuredSessionDocs: [{ id: 'user-1', data: { 'session-1': true, 'session-2': true } }],
      sessionDocs: { 'session-1': { title: 'Keynote' }, 'session-2': { title: 'Workshop' } },
      notificationsUsersDocs: { 'user-1': { tokens: { fid0000000000000000001: true } } },
    });
    const { sendEachForMulticast } = mockMessaging();

    await scheduleNotifications.run(undefined as never);

    expect(sendEachForMulticast).toHaveBeenCalledTimes(2);
  });

  it('does not send a session notification that was already sent by an earlier run', async () => {
    const options = {
      scheduleDocs: upcomingSessionSchedule(['session-1']),
      featuredSessionDocs: [{ id: 'user-1', data: { 'session-1': true } }],
      sessionDocs: { 'session-1': { title: 'Keynote' } },
      notificationsUsersDocs: { 'user-1': { tokens: { fid0000000000000000001: true } } },
    };
    const { claimed } = mockFirestore(options);
    const { sendEachForMulticast } = mockMessaging();

    await scheduleNotifications.run(undefined as never);
    await scheduleNotifications.run(undefined as never);

    expect(claimed).toStrictEqual(new Set(['2025-06-22-session-1']));
    expect(sendEachForMulticast).toHaveBeenCalledTimes(1);
  });

  it('skips a session whose notification was already claimed', async () => {
    mockFirestore({
      scheduleDocs: upcomingSessionSchedule(['session-1']),
      featuredSessionDocs: [{ id: 'user-1', data: { 'session-1': true } }],
      sessionDocs: { 'session-1': { title: 'Keynote' } },
      notificationsUsersDocs: { 'user-1': { tokens: { fid0000000000000000001: true } } },
      claimedNotifications: ['2025-06-22-session-1'],
    });
    const { sendEachForMulticast } = mockMessaging();

    await scheduleNotifications.run(undefined as never);

    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('releases the claim and rethrows when sending fails so a later run can retry', async () => {
    const { released, claimed } = mockFirestore({
      scheduleDocs: upcomingSessionSchedule(['session-1']),
      featuredSessionDocs: [{ id: 'user-1', data: { 'session-1': true } }],
      sessionDocs: { 'session-1': { title: 'Keynote' } },
      notificationsUsersDocs: { 'user-1': { tokens: { fid0000000000000000001: true } } },
    });
    vi.mocked(getMessaging).mockReturnValue({
      sendEachForMulticast: vi.fn().mockRejectedValue(new Error('fcm down')),
    } as never);

    await expect(scheduleNotifications.run(undefined as never)).rejects.toThrow('fcm down');

    expect(released).toStrictEqual(['2025-06-22-session-1']);
    expect(claimed.size).toBe(0);
  });

  it('runs token cleanup when messaging reports an invalid registration token', async () => {
    const { runTransaction, transactionSet } = mockFirestore({
      notificationsConfig: { icon: 'https://example.com/icon.png' },
      scheduleDocs: upcomingSessionSchedule(['session-1']),
      featuredSessionDocs: [{ id: 'user-1', data: { 'session-1': true } }],
      sessionDocs: { 'session-1': { title: 'Keynote' } },
      notificationsUsersDocs: {
        'user-1': { tokens: { fid0000000000000000001: true, fid0000000000000000002: true } },
      },
    });
    mockMessaging([
      { success: false, error: { code: 'messaging/invalid-registration-token' } },
      { success: true },
    ]);
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);

    await scheduleNotifications.run(undefined as never);

    expect(errorSpy).toHaveBeenCalledWith(
      'Failure sending notification to',
      'fid0000000000000000001',
      expect.objectContaining({ code: 'messaging/invalid-registration-token' }),
    );
    expect(runTransaction).toHaveBeenCalledTimes(1);
    expect(transactionSet).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-1' }), {
      tokens: { fid0000000000000000002: true },
    });
  });
});
