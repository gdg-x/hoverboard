import { describe, expect, it } from 'vitest';
import { DELETE } from '../lib/fixes.js';
import { scheduleOnSessions } from './4.0.0-schedule-on-sessions.js';
import { pendingMigrations } from './index.js';

const day = {
  date: '2027-10-15',
  tracks: [{ title: 'Main hall' }],
  timeslots: [{ startTime: '09:00', endTime: '09:40', sessions: [{ items: ['101'] }] }],
};
const documents = [
  { path: 'schedule/2027-10-15', data: day },
  { path: 'sessions/101', data: { title: 'Keynote', extend: 1 } },
  { path: 'sessions/102', data: { title: 'Not on the schedule' } },
];

describe('4.0.0-schedule-on-sessions', () => {
  it('is pending while no session has a day', () => {
    expect(scheduleOnSessions.pending(documents)).toBe(
      '1 day in `schedule`, and 2 sessions without a day.',
    );
    expect(pendingMigrations(documents).map(({ migration }) => migration.id)).toEqual([
      '4.0.0-schedule-on-sessions',
    ]);
  });

  it('is done once a session has a day, or without a schedule', () => {
    const moved = [
      ...documents.slice(0, 2),
      { path: 'sessions/102', data: { title: 'Talk', day: '2027-10-15' } },
    ];
    expect(scheduleOnSessions.pending(moved)).toBeUndefined();
    expect(scheduleOnSessions.pending(documents.slice(1))).toBeUndefined();
  });

  it('runs again when the data has the old shape, even after it ran', () => {
    const restored = [
      ...documents,
      { path: 'config/migrations', data: { '4.0.0-schedule-on-sessions': {} } },
    ];
    expect(pendingMigrations(restored)).toHaveLength(1);
  });

  it('plans the times, the removal of extend and the tracks in site.json', () => {
    const plan = scheduleOnSessions.plan(documents);

    expect(plan.updates).toEqual([
      {
        path: 'sessions/101',
        fields: {
          day: '2027-10-15',
          startTime: '09:00',
          endTime: '09:40',
          extend: DELETE,
        },
      },
    ]);
    expect(plan.creates).toEqual([]);
    expect(plan.site?.({ schedule: { timeZone: 'x' } })).toEqual({
      schedule: { timeZone: 'x', tracks: [{ id: 'main-hall', title: 'Main hall' }] },
    });
    expect(plan.lines).toEqual([
      'sessions/101: 2027-10-15 09:00–09:40, every track',
      'packages/config/site.json schedule.tracks: main-hall',
    ]);
  });
});
