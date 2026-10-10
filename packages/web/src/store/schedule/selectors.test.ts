import { Initialized, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import { selectFeaturedSchedule } from './selectors';
import type { Session } from '../../models/session';
import type { RootState } from '..';

vi.mock('../../utils/firestore');
vi.mock('../dispatch');
vi.mock('../user', () => ({
  selectUserId: vi.fn(),
}));

const session = (id: string, day: string, startTime: string, track: string): Session => ({
  id,
  title: id,
  description: '',
  day,
  startTime,
  endTime: `${startTime.slice(0, 2)}:40`,
  track,
});

const sessions = new Success([
  session('keynote', '2024-01-01', '09:00', 'expo-hall'),
  session('lit', '2024-01-01', '09:00', 'conference-hall'),
  session('redux', '2024-01-01', '10:00', 'expo-hall'),
  session('firebase', '2024-01-02', '09:00', 'expo-hall'),
]);

const stateWith = (featuredSessions: unknown) =>
  ({
    sessions,
    speakers: new Success([]),
    featuredSessions,
  }) as unknown as RootState;

const ids = (state: RootState) =>
  selectFeaturedSchedule(state).map(({ date, timeslots }) => [
    date,
    timeslots.flatMap(({ sessions: blocks }) =>
      blocks.flatMap(({ items }) => items.map(({ id }) => id)),
    ),
  ]);

describe('selectFeaturedSchedule', () => {
  it('is empty until the sessions and speakers load', () => {
    const state = {
      sessions,
      speakers: new Initialized(),
      featuredSessions: new Success({ keynote: true }),
    } as unknown as RootState;

    expect(selectFeaturedSchedule(state)).toStrictEqual([]);
  });

  it('keeps every day and row, with only the saved sessions', () => {
    const state = stateWith(new Success({ keynote: true, redux: true, firebase: false }));

    expect(ids(state)).toEqual([
      ['2024-01-01', ['keynote', 'redux']],
      ['2024-01-02', []],
    ]);
    const [day] = selectFeaturedSchedule(state);
    expect(day!.timeslots.map(({ startTime }) => startTime)).toEqual(['09:00', '09:40', '10:00']);
    expect(day!.timeslots[0]!.sessions.map(({ gridArea }) => gridArea)).toEqual([
      '1 / 1 / 2 / 2',
      '1 / 2 / 2 / 3',
    ]);
  });

  it('has no sessions before the saved sessions load', () => {
    expect(ids(stateWith(new Initialized()))).toEqual([
      ['2024-01-01', []],
      ['2024-01-02', []],
    ]);
  });

  it('returns the same reference while the state is the same', () => {
    const state = stateWith(new Success({ keynote: true }));

    expect(selectFeaturedSchedule(state)).toBe(selectFeaturedSchedule({ ...state }));
  });
});
