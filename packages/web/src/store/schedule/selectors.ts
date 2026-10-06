import { Success } from '@abraham/remotedata';
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '..';
import type { Day } from '../../models/day';
import type { Session } from '../../models/session';
import type { GeneratedSessionBlock, Time } from '../../models/time';
import type { Timeslot } from '../../models/timeslot';
import { type FeaturedSessions, selectFeaturedSessions } from '../featured-sessions';
import { selectScheduleState } from '.';

const selectSchedule = (state: RootState): Day[] => {
  const schedule = selectScheduleState(state);
  return schedule instanceof Success ? schedule.data : [];
};

const filterSessionBlock = (sessionBlock: Time, featuredSessions: FeaturedSessions): Time => ({
  ...sessionBlock,
  items: (sessionBlock as GeneratedSessionBlock).items.filter((session: Session) =>
    Boolean(featuredSessions[session.id]),
  ),
});

const filterTimeslot = (timeslot: Timeslot, featuredSessions: FeaturedSessions): Timeslot => ({
  ...timeslot,
  sessions: timeslot.sessions.map((sessionBlock) =>
    filterSessionBlock(sessionBlock, featuredSessions),
  ),
});

const filterDay = (day: Day, featuredSessions: FeaturedSessions): Day => ({
  ...day,
  timeslots: day.timeslots.map((timeslot) => filterTimeslot(timeslot, featuredSessions)),
});

export const selectFeaturedSchedule = createSelector(
  selectSchedule,
  selectFeaturedSessions,
  (schedule: Day[], featuredSessions: FeaturedSessions): Day[] => {
    return schedule.map((day) => filterDay(day, featuredSessions));
  },
);
