import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import * as logger from 'firebase-functions/logger';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { scheduleNotifications } from '../../src/triggers/schedule-notifications';

vi.mock('firebase-admin/firestore');
vi.mock('firebase-admin/messaging');
vi.mock('firebase-functions/logger');

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

const flushAsyncCallbacks = async () => {
  for (let index = 0; index < 10; index += 1) {
    await Promise.resolve();
  }
};

const mockFirestore = ({
  notificationsConfig,
  scheduleDocs = [],
  featuredSessionDocs = [],
  sessionDocs = {},
  notificationsUsersDocs = {},
}: {
  notificationsConfig?: Record<string, unknown>;
  scheduleDocs?: Array<{ id: string; data: Record<string, unknown> }>;
  featuredSessionDocs?: Array<{ id: string; data: Record<string, unknown> }>;
  sessionDocs?: Record<string, Record<string, unknown>>;
  notificationsUsersDocs?: Record<string, Record<string, unknown>>;
}) => {
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

  return { runTransaction, transactionGet, transactionSet };
};

const mockMessaging = (results: Array<Record<string, unknown>> = [{}]) => {
  const sendToDevice = vi.fn().mockResolvedValue({ results });

  vi.mocked(getMessaging).mockReturnValue({
    sendToDevice,
  } as never);

  return { sendToDevice };
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs and exits when today is missing from the schedule', async () => {
    mockFirestore({
      notificationsConfig: { timezone: '+00:00', icon: 'https://example.com/icon.png' },
      scheduleDocs: [{ id: '2025-06-23', data: { timeslots: [] } }],
    });
    const { sendToDevice } = mockMessaging();
    const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => undefined);

    await scheduleNotifications.run(undefined as never);
    await flushAsyncCallbacks();

    expect(logSpy).toHaveBeenCalledWith('2025-06-22', 'was not found in the schedule');
    expect(sendToDevice).not.toHaveBeenCalled();
  });

  it('does not send notifications when no timeslots are currently upcoming', async () => {
    mockFirestore({
      notificationsConfig: { timezone: '+00:00', icon: 'https://example.com/icon.png' },
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
      notificationsUsersDocs: { 'user-1': { tokens: ['device-token-1'] } },
    });
    const { sendToDevice } = mockMessaging();
    const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => undefined);

    await scheduleNotifications.run(undefined as never);
    await flushAsyncCallbacks();

    expect(sendToDevice).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('logs upcoming sessions when nobody has featured them', async () => {
    mockFirestore({
      notificationsConfig: { timezone: '+00:00', icon: 'https://example.com/icon.png' },
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
    const { sendToDevice } = mockMessaging();
    const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => undefined);

    await scheduleNotifications.run(undefined as never);
    await flushAsyncCallbacks();

    expect(logSpy).toHaveBeenCalledWith('Upcoming sessions', ['session-1']);
    expect(sendToDevice).not.toHaveBeenCalled();
  });

  it('sends a push notification for a featured upcoming session', async () => {
    mockFirestore({
      notificationsConfig: { timezone: '+00:00', icon: 'https://example.com/icon.png' },
      scheduleDocs: [
        {
          id: '2025-06-22',
          data: {
            timeslots: [{ startTime: '14:40', sessions: [{ items: ['session-1'] }] }],
          },
        },
      ],
      featuredSessionDocs: [{ id: 'user-1', data: { 'session-1': true } }],
      sessionDocs: { 'session-1': { title: 'Keynote' } },
      notificationsUsersDocs: { 'user-1': { tokens: ['device-token-1'] } },
    });
    const { sendToDevice } = mockMessaging();

    await scheduleNotifications.run(undefined as never);
    await flushAsyncCallbacks();

    expect(sendToDevice).toHaveBeenCalledWith(['tokens'], {
      data: {
        title: 'Keynote',
        body: 'Starts in 10 minutes',
        icon: 'https://example.com/icon.png',
        path: '/sessions/session-1',
      },
    });
  });

  it('runs token cleanup when messaging reports an invalid registration token', async () => {
    const { runTransaction, transactionSet } = mockFirestore({
      notificationsConfig: { timezone: '+00:00', icon: 'https://example.com/icon.png' },
      scheduleDocs: [
        {
          id: '2025-06-22',
          data: {
            timeslots: [{ startTime: '14:40', sessions: [{ items: ['session-1'] }] }],
          },
        },
      ],
      featuredSessionDocs: [{ id: 'user-1', data: { 'session-1': true } }],
      sessionDocs: { 'session-1': { title: 'Keynote' } },
      notificationsUsersDocs: {
        'user-1': { tokens: ['device-token-1'] },
        'device-token-1': { tokens: ['device-token-1'], keepToken: true },
      },
    });
    mockMessaging([{ error: { code: 'messaging/invalid-registration-token' } }]);
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);

    await scheduleNotifications.run(undefined as never);
    await flushAsyncCallbacks();

    expect(errorSpy).toHaveBeenCalledWith(
      'Failure sending notification to',
      'tokens',
      expect.objectContaining({ code: 'messaging/invalid-registration-token' }),
    );
    expect(runTransaction).toHaveBeenCalledTimes(1);
    expect(transactionSet).toHaveBeenCalledWith(expect.objectContaining({ id: 'device-token-1' }), {
      keepToken: true,
    });
  });
});
