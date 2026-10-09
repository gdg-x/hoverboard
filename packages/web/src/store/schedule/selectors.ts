import { Success } from '@abraham/remotedata';
import { createSelector } from '@reduxjs/toolkit';
import type { BuiltDay, BuiltTimeslot, SessionBlock } from '../../schedule/build-schedule';
import { type FeaturedSessions, selectFeaturedSessions } from '../featured-sessions';
import { selectScheduleState } from '.';

const selectSchedule = createSelector([selectScheduleState], (schedule): BuiltDay[] =>
  schedule instanceof Success ? schedule.data : [],
);

const filterSessionBlock = (
  sessionBlock: SessionBlock,
  featuredSessions: FeaturedSessions,
): SessionBlock => ({
  ...sessionBlock,
  items: sessionBlock.items.filter((session) => Boolean(featuredSessions[session.id])),
});

const filterTimeslot = (
  timeslot: BuiltTimeslot,
  featuredSessions: FeaturedSessions,
): BuiltTimeslot => ({
  ...timeslot,
  sessions: timeslot.sessions.map((sessionBlock) =>
    filterSessionBlock(sessionBlock, featuredSessions),
  ),
});

const filterDay = (day: BuiltDay, featuredSessions: FeaturedSessions): BuiltDay => ({
  ...day,
  timeslots: day.timeslots.map((timeslot) => filterTimeslot(timeslot, featuredSessions)),
});

export const selectFeaturedSchedule = createSelector(
  selectSchedule,
  selectFeaturedSessions,
  (schedule: BuiltDay[], featuredSessions: FeaturedSessions): BuiltDay[] => {
    return schedule.map((day) => filterDay(day, featuredSessions));
  },
);
