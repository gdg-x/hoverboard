import { Success } from '@abraham/remotedata';
import { describe, expect, it } from 'vitest';
import { selectFeaturedSchedule } from './selectors';
import { Day } from '../../models/day';
import { Session } from '../../models/session';
import { RootState } from '..';

describe('selectFeaturedSchedule', () => {
  it('keeps only sessions that are featured, per timeslot', () => {
    const schedule: Day[] = [
      {
        date: '2024-01-01',
        dateReadable: 'Jan 1',
        tracks: [],
        timeslots: [
          {
            startTime: '09:00',
            endTime: '10:00',
            sessions: [{ items: [{ id: 'featured' }, { id: 'not-featured' }] as unknown as Session[] }],
          },
        ],
      },
    ];
    const state = {
      schedule: new Success(schedule),
      featuredSessions: new Success({ featured: true }),
    } as unknown as RootState;

    const result = selectFeaturedSchedule(state);

    expect(result[0]!.timeslots[0]!.sessions[0]).toStrictEqual({
      items: [{ id: 'featured' }],
    });
  });
});
