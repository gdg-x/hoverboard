import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import type { Session } from '../../models/session';
import type { Speaker } from '../../models/speaker';
import { subscribeToSessions } from '../../db/sessions';
import { subscribeToSpeakers } from '../../db/speakers';
import type { RootState } from '..';
import { selectScheduleState, selectSessionsState, selectSpeakersState } from '.';

vi.mock('../../db/sessions');
vi.mock('../../db/speakers');
vi.mock('../dispatch');

const sessions: Session[] = [
  {
    id: 'talk',
    title: 'Talk',
    description: '',
    speakers: ['ada'],
    tags: ['Web'],
    day: '2016-09-09',
    startTime: '09:00',
    endTime: '09:40',
    track: 'expo-hall',
  },
];
const speakers = [{ id: 'ada', name: 'Ada' }] as Speaker[];

const loaded = {
  sessions: new Success(sessions),
  speakers: new Success(speakers),
} as unknown as RootState;

describe('schedule selectors', () => {
  it('build the schedule, sessions and speakers from the raw documents', () => {
    const schedule = selectScheduleState(loaded);
    const built = selectSessionsState(loaded);
    const withSessions = selectSpeakersState(loaded);

    expect(schedule).toBeInstanceOf(Success);
    expect((schedule as Success<{ date: string }[]>).data.map(({ date }) => date)).toEqual([
      '2016-09-09',
    ]);
    expect(built).toStrictEqual(
      new Success([
        expect.objectContaining({
          id: 'talk',
          mainTag: 'Web',
          speakers,
          track: { id: 'expo-hall', title: 'Expo hall' },
          duration: { hh: 0, mm: 40 },
        }),
      ]),
    );
    expect(withSessions).toStrictEqual(
      new Success([expect.objectContaining({ id: 'ada', tags: ['Web'] })]),
    );
  });

  it('build once for the same raw documents', () => {
    const first = selectSessionsState(loaded);

    expect(selectSessionsState({ ...loaded, ui: {} } as RootState)).toBe(first);
    expect(selectScheduleState(loaded)).toBe(selectScheduleState(loaded));
  });

  it('subscribe to both collections, and wait for both', () => {
    vi.mocked(subscribeToSessions).mockReturnValue(new Success(vi.fn()));
    vi.mocked(subscribeToSpeakers).mockReturnValue(new Success(vi.fn()));
    const state = {
      sessions: new Initialized(),
      speakers: new Initialized(),
    } as unknown as RootState;

    expect(selectSessionsState(state)).toStrictEqual(new Pending());
    expect(subscribeToSessions).toHaveBeenCalled();
    expect(subscribeToSpeakers).toHaveBeenCalled();
  });

  it('fail when either collection fails', () => {
    const error = new Error('denied');
    const state = {
      sessions: new Success(sessions),
      speakers: new Failure(error),
    } as unknown as RootState;

    expect(selectSpeakersState(state)).toStrictEqual(new Failure(error));
  });
});
