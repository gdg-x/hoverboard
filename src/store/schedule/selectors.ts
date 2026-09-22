import { Success } from '@abraham/remotedata';
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import { Day } from '../../models/day';
import { Session } from '../../models/session';
import { Time } from '../../models/time';
import { Timeslot } from '../../models/timeslot';
import { TempAny } from '../../temp-any';
import { FeaturedSessions, selectFeaturedSessions } from '../featured-sessions';
import { selectScheduleState } from '.';

const selectSchedule = (state: RootState): Day[] => {
  const schedule = selectScheduleState(state);
  return schedule instanceof Success ? schedule.data : [];
};

export const selectFeaturedSchedule = createSelector(
  selectSchedule,
  selectFeaturedSessions,
  (schedule: Day[], featuredSessions: FeaturedSessions): Day[] => {
    // TODO: Cleanup
    return schedule.map((day: Day) => {
      return {
        ...day,
        timeslots: day.timeslots.map((timeslot: Timeslot) => {
          return {
            ...timeslot,
            sessions: timeslot.sessions.map((sessionBlock: Time) => {
              const items = (sessionBlock.items as TempAny as Session[]).filter(
                (session: Session): boolean => Boolean(featuredSessions[session.id]),
              );
              return {
                ...sessionBlock,
                items,
              };
            }),
          };
        }),
      };
    });
  },
);
