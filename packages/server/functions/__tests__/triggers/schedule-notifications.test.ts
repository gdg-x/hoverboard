import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import * as logger from 'firebase-functions/logger';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSiteConfig } from '../../src/site-config';
import { scheduleNotifications } from '../../src/triggers/schedule-notifications';
import { expectNoPersonalDataLogged } from '../personal-data';

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
  empty: docs.length === 0,
  docs: docs.map((doc) => ({
    id: doc.id,
    data: () => doc.data,
  })),
});

const mockFirestore = ({
  notificationsConfig,
  sessionDocs = [],
  featuredSessionDocs = [],
  notificationsUsersDocs = {},
  claimedNotifications = [],
}: {
  notificationsConfig?: Record<string, unknown>;
  sessionDocs?: Array<{ id: string; data: Record<string, unknown> }>;
  featuredSessionDocs?: Array<{ id: string; data: Record<string, unknown> }>;
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
        case 'featuredSessions':
          return {
            get: vi.fn().mockResolvedValue(createQuerySnapshot(featuredSessionDocs)),
          };
        case 'sessions':
          return {
            where: vi.fn().mockImplementation((field: string, _op: string, value: unknown) => ({
              get: vi
                .fn()
                .mockResolvedValue(
                  createQuerySnapshot(sessionDocs.filter(({ data }) => data[field] === value)),
                ),
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

// Sessions on the mocked day, starting in 10 minutes unless `startTime` says otherwise.
const sessionsAt = (titles: Record<string, string>, startTime = '14:40', day = '2025-06-22') =>
  Object.entries(titles).map(([id, title]) => ({ id, data: { title, day, startTime } }));

describe('scheduleNotifications', () => {
  beforeEach(() => {
    vi.mocked(getFirestore).mockReset();
    vi.mocked(getMessaging).mockReset();
    vi.mocked(getSiteConfig).mockReturnValue({ features: {}, timeZone: 'UTC' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Runs before the restore above, which removes the spies' calls.
  afterEach(expectNoPersonalDataLogged);

  it('sends reminders without an icon when config/notifications is missing', async () => {
    mockFirestore({
      sessionDocs: sessionsAt({ 'session-1': 'Keynote' }),
      featuredSessionDocs: [{ id: 'user-1', data: { 'session-1': true } }],
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
    mockFirestore({ sessionDocs: sessionsAt({ 'session-1': 'Keynote' }) });
    mockMessaging();
    const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => undefined);

    await scheduleNotifications.run(undefined as never);

    expect(logSpy).toHaveBeenCalledWith('2025-06-23', 'has no sessions');
  });

  it('reads session start times in the event time zone', async () => {
    // 14:30 UTC is 17:30 in Kyiv, so a session at 17:40 starts in 10 minutes.
    vi.mocked(getSiteConfig).mockReturnValue({ features: {}, timeZone: 'Europe/Kyiv' });
    mockFirestore({
      sessionDocs: sessionsAt({ 'session-1': 'Keynote' }, '17:40'),
      featuredSessionDocs: [{ id: 'user-1', data: { 'session-1': true } }],
      notificationsUsersDocs: { 'user-1': { tokens: { fid0000000000000000001: true } } },
    });
    const { sendEachForMulticast } = mockMessaging();

    await scheduleNotifications.run(undefined as never);

    expect(sendEachForMulticast).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ body: 'Starts in 10 minutes' }) }),
    );
  });

  it('logs and exits when no session is on today', async () => {
    mockFirestore({
      notificationsConfig: { icon: 'https://example.com/icon.png' },
      sessionDocs: [
        ...sessionsAt({ 'session-1': 'Keynote' }, '14:40', '2025-06-23'),
        // Not scheduled yet.
        { id: 'session-2', data: { title: 'Workshop' } },
      ],
    });
    const { sendEachForMulticast } = mockMessaging();
    const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => undefined);

    await scheduleNotifications.run(undefined as never);

    expect(logSpy).toHaveBeenCalledWith('2025-06-22', 'has no sessions');
    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('does not send notifications when no session starts soon', async () => {
    mockFirestore({
      notificationsConfig: { icon: 'https://example.com/icon.png' },
      sessionDocs: sessionsAt({ 'session-1': 'Keynote' }, '15:00'),
      featuredSessionDocs: [{ id: 'user-1', data: { 'session-1': true } }],
      notificationsUsersDocs: { 'user-1': { tokens: { fid0000000000000000001: true } } },
    });
    const { sendEachForMulticast } = mockMessaging();
    const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => undefined);

    await scheduleNotifications.run(undefined as never);

    expect(sendEachForMulticast).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("reminds of each session at its own start time, not its neighbours'", async () => {
    mockFirestore({
      sessionDocs: [
        ...sessionsAt({ 'session-1': 'Keynote' }),
        ...sessionsAt({ 'session-2': 'Lightning talk' }, '14:20'),
      ],
      featuredSessionDocs: [{ id: 'user-1', data: { 'session-1': true, 'session-2': true } }],
      notificationsUsersDocs: { 'user-1': { tokens: { fid0000000000000000001: true } } },
    });
    const { sendEachForMulticast } = mockMessaging();

    await scheduleNotifications.run(undefined as never);

    expect(sendEachForMulticast).toHaveBeenCalledTimes(1);
    expect(sendEachForMulticast).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ title: 'Keynote' }) }),
    );
  });

  it('logs upcoming sessions when nobody has featured them', async () => {
    mockFirestore({
      notificationsConfig: { icon: 'https://example.com/icon.png' },
      sessionDocs: sessionsAt({ 'session-1': 'Keynote' }),
      featuredSessionDocs: [{ id: 'user-1', data: { 'session-2': true } }],
    });
    const { sendEachForMulticast } = mockMessaging();
    const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => undefined);

    await scheduleNotifications.run(undefined as never);

    expect(logSpy).toHaveBeenCalledWith('Upcoming sessions', ['session-1']);
    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('sends a push notification to the device tokens of users who featured the session', async () => {
    mockFirestore({
      notificationsConfig: { icon: 'https://example.com/icon.png' },
      sessionDocs: sessionsAt({ 'session-1': 'Keynote' }),
      featuredSessionDocs: [
        { id: 'user-1', data: { 'session-1': true } },
        { id: 'user-2', data: { 'session-1': true } },
        { id: 'user-3', data: { 'session-2': true } },
      ],
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
      sessionDocs: sessionsAt({ 'session-1': 'Keynote' }),
      featuredSessionDocs: [{ id: 'user-1', data: { 'session-1': true } }],
      notificationsUsersDocs: { 'user-1': { tokens: {} } },
    });
    const { sendEachForMulticast } = mockMessaging();

    await scheduleNotifications.run(undefined as never);

    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('waits for every session before resolving', async () => {
    mockFirestore({
      sessionDocs: sessionsAt({ 'session-1': 'Keynote', 'session-2': 'Workshop' }),
      featuredSessionDocs: [{ id: 'user-1', data: { 'session-1': true, 'session-2': true } }],
      notificationsUsersDocs: { 'user-1': { tokens: { fid0000000000000000001: true } } },
    });
    const { sendEachForMulticast } = mockMessaging();

    await scheduleNotifications.run(undefined as never);

    expect(sendEachForMulticast).toHaveBeenCalledTimes(2);
  });

  it('does not send a session notification that was already sent by an earlier run', async () => {
    const options = {
      sessionDocs: sessionsAt({ 'session-1': 'Keynote' }),
      featuredSessionDocs: [{ id: 'user-1', data: { 'session-1': true } }],
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
      sessionDocs: sessionsAt({ 'session-1': 'Keynote' }),
      featuredSessionDocs: [{ id: 'user-1', data: { 'session-1': true } }],
      notificationsUsersDocs: { 'user-1': { tokens: { fid0000000000000000001: true } } },
      claimedNotifications: ['2025-06-22-session-1'],
    });
    const { sendEachForMulticast } = mockMessaging();

    await scheduleNotifications.run(undefined as never);

    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('releases the claim and rethrows when sending fails so a later run can retry', async () => {
    const { released, claimed } = mockFirestore({
      sessionDocs: sessionsAt({ 'session-1': 'Keynote' }),
      featuredSessionDocs: [{ id: 'user-1', data: { 'session-1': true } }],
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
      sessionDocs: sessionsAt({ 'session-1': 'Keynote' }),
      featuredSessionDocs: [{ id: 'user-1', data: { 'session-1': true } }],
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
      'Failure sending notification to token aa13b012ca',
      expect.objectContaining({ code: 'messaging/invalid-registration-token' }),
    );
    expect(runTransaction).toHaveBeenCalledTimes(1);
    expect(transactionSet).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-1' }), {
      tokens: { fid0000000000000000002: true },
    });
  });

  describe('stream links', () => {
    const remind = async (
      session: Record<string, unknown>,
      config: Partial<ReturnType<typeof getSiteConfig>> = {},
    ) => {
      vi.mocked(getSiteConfig).mockReturnValue({ features: {}, timeZone: 'UTC', ...config });
      mockFirestore({
        sessionDocs: [
          {
            id: 'session-1',
            data: { title: 'Keynote', day: '2025-06-22', startTime: '14:40', ...session },
          },
        ],
        featuredSessionDocs: [{ id: 'user-1', data: { 'session-1': true } }],
        notificationsUsersDocs: { 'user-1': { tokens: { fid0000000000000000001: true } } },
      });
      const { sendEachForMulticast } = mockMessaging();
      await scheduleNotifications.run(undefined as never);
      return (sendEachForMulticast.mock.calls[0]![0] as { data: Record<string, string> }).data;
    };
    const online = {
      attendance: 'online',
      stream: 'https://stream.example/event',
      trackStreams: { main: 'https://stream.example/main' },
    };

    it("sends the session's link, then its track's, then the event's online", async () => {
      expect(
        (await remind({ track: 'main', stream: 'https://stream.example/own' }, online)).stream,
      ).toBe('https://stream.example/own');
      expect((await remind({ track: 'main' }, online)).stream).toBe('https://stream.example/main');
      expect((await remind({ track: 'side' }, online)).stream).toBe('https://stream.example/event');
    });

    it("sends no link in person without the session's or track's own", async () => {
      expect(await remind({}, { ...online, attendance: 'inPerson' })).not.toHaveProperty('stream');
      expect((await remind({ track: 'main' }, { ...online, attendance: 'inPerson' })).stream).toBe(
        'https://stream.example/main',
      );
    });

    it('sends no link that is not https', async () => {
      expect(await remind({ stream: 'javascript:alert(1)' })).not.toHaveProperty('stream');
    });
  });
});
