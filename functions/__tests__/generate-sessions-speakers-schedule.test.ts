import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  scheduleWrite,
  sessionsWrite,
  speakersWrite,
} from '../src/generate-sessions-speakers-schedule';
import { sessionsSpeakersMap as sessionsSpeakersMapUntyped } from '../src/schedule-generator/speakers-sessions-map.js';
import { sessionsSpeakersScheduleMap as sessionsSpeakersScheduleMapUntyped } from '../src/schedule-generator/speakers-sessions-schedule-map.js';

vi.mock('firebase-admin/firestore');
vi.mock('../src/schedule-generator/speakers-sessions-map.js', () => ({
  sessionsSpeakersMap: vi.fn(),
}));
vi.mock('../src/schedule-generator/speakers-sessions-schedule-map.js', () => ({
  sessionsSpeakersScheduleMap: vi.fn(),
}));

type AnyRecord = Record<string, any>;
const sessionsSpeakersMap = vi.mocked(sessionsSpeakersMapUntyped);
const sessionsSpeakersScheduleMap = vi.mocked(sessionsSpeakersScheduleMapUntyped);

const mockQuerySnapshot = (docs: Array<[string, Record<string, unknown>]>) => ({
  docs: docs.map(([id, data]) => ({
    id,
    data: () => data,
  })),
});

const setupFirestore = ({
  scheduleConfigExists = true,
  scheduleEnabled = false,
  scheduleDocs = [],
  sessionsDocs = [],
  speakersDocs = [],
}: {
  scheduleConfigExists?: boolean;
  scheduleEnabled?: boolean | string;
  scheduleDocs?: Array<[string, Record<string, unknown>]>;
  sessionsDocs?: Array<[string, Record<string, unknown>]>;
  speakersDocs?: Array<[string, Record<string, unknown>]>;
} = {}) => {
  const writes: Array<{ collection: string; data: AnyRecord; id: string }> = [];

  const collection = vi.fn().mockImplementation((collectionName: string) => {
    if (collectionName === 'sessions') {
      return {
        get: vi.fn().mockResolvedValue(mockQuerySnapshot(sessionsDocs)),
      };
    }

    if (collectionName === 'schedule') {
      return {
        orderBy: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockQuerySnapshot(scheduleDocs)),
        }),
      };
    }

    if (collectionName === 'speakers') {
      return {
        get: vi.fn().mockResolvedValue(mockQuerySnapshot(speakersDocs)),
      };
    }

    if (collectionName === 'config') {
      return {
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            exists: scheduleConfigExists,
            data: () => ({ enabled: scheduleEnabled }),
          }),
        }),
      };
    }

    if (
      collectionName === 'generatedSessions' ||
      collectionName === 'generatedSpeakers' ||
      collectionName === 'generatedSchedule'
    ) {
      return {
        doc: vi.fn().mockImplementation((id: string) => ({
          set: vi.fn().mockImplementation((data: AnyRecord) => {
            writes.push({ collection: collectionName, data, id });
            return Promise.resolve();
          }),
        })),
      };
    }

    throw new Error(`Unexpected collection: ${collectionName}`);
  });

  vi.mocked(getFirestore).mockReturnValue({ collection } as never);

  return { collection, writes };
};

describe('generate-sessions-speakers-schedule triggers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('regenerates session and speaker data on sessionsWrite when schedule is disabled', async () => {
    const generated = {
      sessions: {
        'session-1': { title: 'Keynote' },
      },
      speakers: {
        'speaker-1': { name: 'Ada Lovelace' },
      },
    };
    const { writes } = setupFirestore({
      scheduleDocs: [['day-1', { title: 'Unused day' }]],
      scheduleEnabled: false,
      sessionsDocs: [['session-1', { title: 'Keynote', speakers: ['speaker-1'] }]],
      speakersDocs: [['speaker-1', { name: 'Ada Lovelace' }]],
    });
    sessionsSpeakersMap.mockReturnValue(generated);
    const errorSpy = vi.spyOn(functions.logger, 'error').mockImplementation(() => undefined);

    await sessionsWrite.run(
      {
        after: { exists: true, data: () => ({}) },
        before: { exists: true, data: () => ({}) },
      } as never,
      { params: { sessionId: 'session-1' } } as never,
    );

    expect(sessionsSpeakersMap).toHaveBeenCalledWith(
      { 'session-1': { title: 'Keynote', speakers: ['speaker-1'] } },
      { 'speaker-1': { name: 'Ada Lovelace' } },
    );
    expect(sessionsSpeakersScheduleMap).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      'Attempting to write empty data to Firestore collection: "generatedSchedule".',
    );
    expect(writes).toContainEqual({
      collection: 'generatedSessions',
      data: { title: 'Keynote' },
      id: 'session-1',
    });
    expect(writes).toContainEqual({
      collection: 'generatedSpeakers',
      data: { name: 'Ada Lovelace' },
      id: 'speaker-1',
    });
  });

  it('skips scheduleWrite when the schedule config is missing', async () => {
    const { collection, writes } = setupFirestore({
      scheduleConfigExists: false,
    });
    const errorSpy = vi.spyOn(functions.logger, 'error').mockImplementation(() => undefined);

    const result = await scheduleWrite.run(
      {
        after: { exists: true, data: () => ({}) },
        before: { exists: true, data: () => ({}) },
      } as never,
      { params: { scheduleId: 'day-1' } } as never,
    );

    expect(result).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      'Schedule config is not set. Set the `config/schedule.enabled=true` Firestore value.',
    );
    expect(collection).toHaveBeenCalledWith('config');
    expect(collection).not.toHaveBeenCalledWith('sessions');
    expect(collection).not.toHaveBeenCalledWith('schedule');
    expect(collection).not.toHaveBeenCalledWith('speakers');
    expect(sessionsSpeakersMap).not.toHaveBeenCalled();
    expect(sessionsSpeakersScheduleMap).not.toHaveBeenCalled();
    expect(writes).toStrictEqual([]);
  });

  it('adds a changed speaker back into generated speakers when they have no sessions yet', async () => {
    const { writes } = setupFirestore({
      scheduleEnabled: false,
      sessionsDocs: [['session-1', { title: 'Keynote', speakers: ['speaker-1'] }]],
      speakersDocs: [
        ['speaker-1', { name: 'Ada Lovelace' }],
        ['speaker-2', { name: 'Grace Hopper', company: 'Navy' }],
      ],
    });
    sessionsSpeakersMap.mockReturnValue({
      sessions: {
        'session-1': { title: 'Keynote' },
      },
      speakers: {
        'speaker-1': { name: 'Ada Lovelace' },
      },
    });
    const errorSpy = vi.spyOn(functions.logger, 'error').mockImplementation(() => undefined);

    await speakersWrite.run(
      {
        after: {
          exists: true,
          data: () => ({ name: 'Grace Hopper', company: 'Navy' }),
        },
        before: {
          exists: false,
          data: () => undefined,
        },
      } as never,
      { params: { speakerId: 'speaker-2' } } as never,
    );

    expect(sessionsSpeakersMap).toHaveBeenCalledWith(
      { 'session-1': { title: 'Keynote', speakers: ['speaker-1'] } },
      {
        'speaker-1': { name: 'Ada Lovelace' },
        'speaker-2': { company: 'Navy', name: 'Grace Hopper' },
      },
    );
    expect(errorSpy).toHaveBeenCalledWith(
      'Attempting to write empty data to Firestore collection: "generatedSchedule".',
    );
    expect(writes).toContainEqual({
      collection: 'generatedSpeakers',
      data: { company: 'Navy', id: 'speaker-2', name: 'Grace Hopper' },
      id: 'speaker-2',
    });
  });

  it('logs and skips writes when generated data is empty', async () => {
    const { writes } = setupFirestore({
      scheduleDocs: [['day-1', { date: '2026-08-01' }]],
      scheduleEnabled: true,
      sessionsDocs: [['session-1', { title: 'Keynote' }]],
      speakersDocs: [['speaker-1', { name: 'Ada Lovelace' }]],
    });
    sessionsSpeakersScheduleMap.mockReturnValue({
      schedule: {},
      sessions: {},
      speakers: {},
    });
    const errorSpy = vi.spyOn(functions.logger, 'error').mockImplementation(() => undefined);

    await scheduleWrite.run(
      {
        after: { exists: true, data: () => ({}) },
        before: { exists: true, data: () => ({}) },
      } as never,
      { params: { scheduleId: 'day-1' } } as never,
    );

    expect(sessionsSpeakersScheduleMap).toHaveBeenCalledWith(
      { 'session-1': { title: 'Keynote' } },
      { 'speaker-1': { name: 'Ada Lovelace' } },
      { 'day-1': { date: '2026-08-01' } },
    );
    expect(errorSpy).toHaveBeenCalledTimes(3);
    expect(errorSpy).toHaveBeenCalledWith(
      'Attempting to write empty data to Firestore collection: "generatedSessions".',
    );
    expect(errorSpy).toHaveBeenCalledWith(
      'Attempting to write empty data to Firestore collection: "generatedSpeakers".',
    );
    expect(errorSpy).toHaveBeenCalledWith(
      'Attempting to write empty data to Firestore collection: "generatedSchedule".',
    );
    expect(writes).toStrictEqual([]);
  });
});
