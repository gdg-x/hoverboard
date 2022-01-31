import { Initialized, Success } from '@abraham/remotedata';
import { createSelector } from '@reduxjs/toolkit';
import { RootState, store } from '..';
import { Day } from '../../models/day';
import { Session } from '../../models/session';
import { Time } from '../../models/time';
import { Timeslot } from '../../models/timeslot';
import { TempAny } from '../../temp-any';
import { selectFeaturedSessions } from '../featured-sessions/selectors';
import { FeaturedSessions } from '../featured-sessions/state';
import { fetchSchedule } from './actions';

const selectSchedule = (state: RootState): Day[] => {
  if (state.schedule instanceof Success) {
    return state.schedule.data;
  } else if (state.schedule instanceof Initialized) {
    store.dispatch(fetchSchedule);
  }
  return [];
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
                (session: Session): boolean => Boolean(featuredSessions[session.id])
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
  }
);
