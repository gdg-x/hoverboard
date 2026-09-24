import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import { selectFeaturedSchedule } from './selectors';
import { Day } from '../../models/day';
import { Session } from '../../models/session';
import { GeneratedSessionBlock } from '../../models/time';
import { Track } from '../../models/track';
import { RootState } from '..';

vi.mock('../../utils/firestore');
vi.mock('../dispatch');
vi.mock('../user', () => ({
  selectUserId: vi.fn(),
}));

const mockTracks: Track[] = [{ title: 'Track 1' }, { title: 'Track 2' }];

const mockSession1 = {
  id: 'session-1',
  title: 'Keynote',
  language: 'English',
} as Session;

const mockSession2 = {
  id: 'session-2',
  title: 'Deep Dive into Lit',
  language: 'English',
} as Session;

const mockSession3 = {
  id: 'session-3',
  title: 'State Management with Redux',
  language: 'English',
} as Session;

const mockSession4 = {
  id: 'session-4',
  title: 'Firebase Masterclass',
  language: 'English',
} as Session;

const mockSchedule: Day[] = [
  {
    date: '2024-01-01',
    dateReadable: 'Jan 1',
    tracks: mockTracks,
    timeslots: [
      {
        startTime: '09:00',
        endTime: '10:00',
        sessions: [
          {
            gridArea: '1 / 1 / 2 / 3',
            extend: 2,
            items: [mockSession1, mockSession2],
          } as GeneratedSessionBlock,
        ],
      },
      {
        startTime: '10:00',
        endTime: '11:00',
        sessions: [
          {
            gridArea: '2 / 1 / 3 / 2',
            items: [mockSession3],
          } as GeneratedSessionBlock,
          {
            gridArea: '2 / 2 / 3 / 3',
            items: [mockSession4],
          } as GeneratedSessionBlock,
        ],
      },
    ],
  },
  {
    date: '2024-01-02',
    dateReadable: 'Jan 2',
    tracks: mockTracks,
    timeslots: [
      {
        startTime: '09:00',
        endTime: '10:00',
        sessions: [
          {
            gridArea: '1 / 1 / 2 / 2',
            items: [mockSession1],
          } as GeneratedSessionBlock,
        ],
      },
    ],
  },
];

describe('selectFeaturedSchedule', () => {
  describe('when schedule is not loaded yet', () => {
    it('returns an empty array when schedule is Initialized', () => {
      const state = {
        schedule: new Initialized(),
        featuredSessions: new Success({ 'session-1': true }),
      } as unknown as RootState;

      expect(selectFeaturedSchedule(state)).toStrictEqual([]);
    });

    it('returns an empty array when schedule is Pending', () => {
      const state = {
        schedule: new Pending(),
        featuredSessions: new Success({ 'session-1': true }),
      } as unknown as RootState;

      expect(selectFeaturedSchedule(state)).toStrictEqual([]);
    });

    it('returns an empty array when schedule is Failure', () => {
      const state = {
        schedule: new Failure(new Error('Failed to load schedule')),
        featuredSessions: new Success({ 'session-1': true }),
      } as unknown as RootState;

      expect(selectFeaturedSchedule(state)).toStrictEqual([]);
    });
  });

  describe('when featured sessions are not loaded or empty', () => {
    it('returns the schedule structure with empty items when featuredSessions is Initialized', () => {
      const state = {
        schedule: new Success(mockSchedule),
        featuredSessions: new Initialized(),
      } as unknown as RootState;

      const result = selectFeaturedSchedule(state);

      expect(result).toHaveLength(2);
      expect(result[0]!.timeslots[0]!.sessions[0]!.items).toStrictEqual([]);
      expect(result[0]!.timeslots[1]!.sessions[0]!.items).toStrictEqual([]);
      expect(result[0]!.timeslots[1]!.sessions[1]!.items).toStrictEqual([]);
      expect(result[1]!.timeslots[0]!.sessions[0]!.items).toStrictEqual([]);
    });

    it('returns the schedule structure with empty items when featuredSessions is Pending', () => {
      const state = {
        schedule: new Success(mockSchedule),
        featuredSessions: new Pending(),
      } as unknown as RootState;

      const result = selectFeaturedSchedule(state);

      expect(result).toHaveLength(2);
      expect(result[0]!.timeslots[0]!.sessions[0]!.items).toStrictEqual([]);
    });

    it('returns the schedule structure with empty items when featuredSessions is Failure', () => {
      const state = {
        schedule: new Success(mockSchedule),
        featuredSessions: new Failure(new Error('Failed to load featured sessions')),
      } as unknown as RootState;

      const result = selectFeaturedSchedule(state);

      expect(result).toHaveLength(2);
      expect(result[0]!.timeslots[0]!.sessions[0]!.items).toStrictEqual([]);
    });

    it('returns the schedule structure with empty items when featuredSessions is empty', () => {
      const state = {
        schedule: new Success(mockSchedule),
        featuredSessions: new Success({}),
      } as unknown as RootState;

      const result = selectFeaturedSchedule(state);

      expect(result).toHaveLength(2);
      expect(result[0]!.timeslots[0]!.sessions[0]!.items).toStrictEqual([]);
    });
  });

  describe('filtering featured sessions', () => {
    it('keeps only sessions whose ID is mapped to true in featuredSessions', () => {
      const state = {
        schedule: new Success(mockSchedule),
        featuredSessions: new Success({
          'session-1': true,
          'session-3': true,
        }),
      } as unknown as RootState;

      const result = selectFeaturedSchedule(state);

      expect(result[0]!.timeslots[0]!.sessions[0]!.items).toStrictEqual([mockSession1]);
      expect(result[0]!.timeslots[1]!.sessions[0]!.items).toStrictEqual([mockSession3]);
      expect(result[0]!.timeslots[1]!.sessions[1]!.items).toStrictEqual([]);
      expect(result[1]!.timeslots[0]!.sessions[0]!.items).toStrictEqual([mockSession1]);
    });

    it('excludes sessions mapped to false or omitted', () => {
      const state = {
        schedule: new Success(mockSchedule),
        featuredSessions: new Success({
          'session-1': false,
          'session-2': true,
        }),
      } as unknown as RootState;

      const result = selectFeaturedSchedule(state);

      expect(result[0]!.timeslots[0]!.sessions[0]!.items).toStrictEqual([mockSession2]);
    });

    it('preserves all sessions in a block when all are featured', () => {
      const state = {
        schedule: new Success(mockSchedule),
        featuredSessions: new Success({
          'session-1': true,
          'session-2': true,
        }),
      } as unknown as RootState;

      const result = selectFeaturedSchedule(state);

      expect(result[0]!.timeslots[0]!.sessions[0]!.items).toStrictEqual([
        mockSession1,
        mockSession2,
      ]);
    });

    it('maintains the original session order when filtering', () => {
      const multiSessionSchedule: Day[] = [
        {
          date: '2024-01-01',
          dateReadable: 'Jan 1',
          tracks: [],
          timeslots: [
            {
              startTime: '09:00',
              endTime: '10:00',
              sessions: [
                {
                  gridArea: '1 / 1 / 2 / 2',
                  items: [mockSession1, mockSession2, mockSession3, mockSession4],
                } as GeneratedSessionBlock,
              ],
            },
          ],
        },
      ];

      const state = {
        schedule: new Success(multiSessionSchedule),
        featuredSessions: new Success({
          'session-1': true,
          'session-4': true,
        }),
      } as unknown as RootState;

      const result = selectFeaturedSchedule(state);

      expect(result[0]!.timeslots[0]!.sessions[0]!.items).toStrictEqual([
        mockSession1,
        mockSession4,
      ]);
    });
  });

  describe('preserving schedule structure and metadata', () => {
    it('preserves day properties (date, dateReadable, tracks)', () => {
      const state = {
        schedule: new Success(mockSchedule),
        featuredSessions: new Success({ 'session-1': true }),
      } as unknown as RootState;

      const result = selectFeaturedSchedule(state);

      expect(result[0]!.date).toBe('2024-01-01');
      expect(result[0]!.dateReadable).toBe('Jan 1');
      expect(result[0]!.tracks).toStrictEqual(mockTracks);
      expect(result[1]!.date).toBe('2024-01-02');
      expect(result[1]!.dateReadable).toBe('Jan 2');
      expect(result[1]!.tracks).toStrictEqual(mockTracks);
    });

    it('preserves timeslot properties (startTime, endTime)', () => {
      const state = {
        schedule: new Success(mockSchedule),
        featuredSessions: new Success({ 'session-1': true }),
      } as unknown as RootState;

      const result = selectFeaturedSchedule(state);

      expect(result[0]!.timeslots[0]!.startTime).toBe('09:00');
      expect(result[0]!.timeslots[0]!.endTime).toBe('10:00');
      expect(result[0]!.timeslots[1]!.startTime).toBe('10:00');
      expect(result[0]!.timeslots[1]!.endTime).toBe('11:00');
    });

    it('preserves session block properties (gridArea, extend)', () => {
      const state = {
        schedule: new Success(mockSchedule),
        featuredSessions: new Success({ 'session-1': true }),
      } as unknown as RootState;

      const result = selectFeaturedSchedule(state);

      const block1 = result[0]!.timeslots[0]!.sessions[0] as GeneratedSessionBlock;
      expect(block1.gridArea).toBe('1 / 1 / 2 / 3');
      expect(block1.extend).toBe(2);

      const block2 = result[0]!.timeslots[1]!.sessions[0] as GeneratedSessionBlock;
      expect(block2.gridArea).toBe('2 / 1 / 3 / 2');
    });
  });

  describe('memoization', () => {
    it('returns the same reference when state has not changed', () => {
      const state = {
        schedule: new Success(mockSchedule),
        featuredSessions: new Success({ 'session-1': true }),
      } as unknown as RootState;

      const result1 = selectFeaturedSchedule(state);
      const result2 = selectFeaturedSchedule(state);

      expect(result1).toBe(result2);
    });

    it('returns the same reference when unrelated state changes', () => {
      const state1 = {
        schedule: new Success(mockSchedule),
        featuredSessions: new Success({ 'session-1': true }),
        user: new Initialized(),
      } as unknown as RootState;

      const result1 = selectFeaturedSchedule(state1);

      const state2 = {
        ...state1,
        user: new Success({ uid: 'user-1' }),
      } as unknown as RootState;

      const result2 = selectFeaturedSchedule(state2);

      expect(result1).toBe(result2);
    });

    it('recomputes when schedule changes', () => {
      const state1 = {
        schedule: new Success(mockSchedule),
        featuredSessions: new Success({ 'session-1': true }),
      } as unknown as RootState;

      const result1 = selectFeaturedSchedule(state1);

      const state2 = {
        schedule: new Success([]),
        featuredSessions: new Success({ 'session-1': true }),
      } as unknown as RootState;

      const result2 = selectFeaturedSchedule(state2);

      expect(result1).not.toBe(result2);
      expect(result2).toStrictEqual([]);
    });

    it('recomputes when featuredSessions changes', () => {
      const state1 = {
        schedule: new Success(mockSchedule),
        featuredSessions: new Success({ 'session-1': true }),
      } as unknown as RootState;

      const result1 = selectFeaturedSchedule(state1);

      const state2 = {
        schedule: new Success(mockSchedule),
        featuredSessions: new Success({ 'session-2': true }),
      } as unknown as RootState;

      const result2 = selectFeaturedSchedule(state2);

      expect(result1).not.toBe(result2);
      expect(result2[0]!.timeslots[0]!.sessions[0]!.items).toStrictEqual([mockSession2]);
    });
  });
});
