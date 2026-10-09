import { Failure, Pending, type RemoteData, Success } from '@abraham/remotedata';
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '..';
import { scheduleOptions } from '../../config/site';
import {
  type BuiltDay,
  type BuiltSchedule,
  type BuiltSession,
  type BuiltSpeaker,
  buildSchedule,
} from '../../schedule/build-schedule';
import { selectRawSessionsState } from '../sessions';
import { selectRawSpeakersState } from '../speakers';

export type ScheduleState = RemoteData<Error, BuiltDay[]>;
export type SessionsState = RemoteData<Error, BuiltSession[]>;
export type SpeakersState = RemoteData<Error, BuiltSpeaker[]>;

/** The schedule, sessions and speakers, built from the raw sessions and speakers once both load. */
export const selectBuiltSchedule = createSelector(
  [selectRawSessionsState, selectRawSpeakersState],
  (sessions, speakers): RemoteData<Error, BuiltSchedule> => {
    if (sessions instanceof Failure) return sessions;
    if (speakers instanceof Failure) return speakers;
    if (sessions instanceof Success && speakers instanceof Success) {
      return new Success(
        buildSchedule({ sessions: sessions.data, speakers: speakers.data }, scheduleOptions),
      );
    }
    return new Pending();
  },
);

const selectPart = <K extends keyof BuiltSchedule>(key: K) =>
  createSelector([selectBuiltSchedule], (built): RemoteData<Error, BuiltSchedule[K]> =>
    built instanceof Success ? new Success(built.data[key]) : built,
  );

export const selectScheduleState: (state: RootState) => ScheduleState = selectPart('schedule');
export const selectSessionsState: (state: RootState) => SessionsState = selectPart('sessions');
export const selectSpeakersState: (state: RootState) => SpeakersState = selectPart('speakers');
