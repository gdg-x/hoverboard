import { SpeakerMap } from './firestore.js';

export interface RawScheduleSession {
  items?: string[];
  extend?: number;
}

export interface RawScheduleTimeslot {
  startTime?: string;
  endTime?: string;
  sessions?: RawScheduleSession[];
}

export interface RawScheduleDay {
  tracks?: string[];
  dateReadable?: string;
  timeslots: RawScheduleTimeslot[];
}

/** Sessions built so far in the current schedule pass, keyed by session id. */
export type BuiltSessions = Record<string, { endTime: string }>;

export const calculateStartTime = (
  subSessionsLen: number,
  subSessionIndex: number,
  sessionIndex: number,
  sessions: BuiltSessions,
  timeslot: RawScheduleTimeslot,
) => {
  return subSessionsLen > 1 && subSessionIndex > 0
    ? sessions[timeslot.sessions[sessionIndex].items[subSessionIndex - 1]].endTime
    : timeslot.startTime;
};

export const calculateEndTime = (
  subSessionsLen: number,
  timeslot: RawScheduleTimeslot,
  sessionIndex: number,
  day: RawScheduleDay,
  timeslotsIndex: number,
  dayKey: string,
  subSessionIndex: number,
) => {
  const endTimeRaw = timeslot.sessions[sessionIndex].extend
    ? day.timeslots[timeslotsIndex + timeslot.sessions[sessionIndex].extend - 1].endTime
    : timeslot.endTime;

  return subSessionsLen > 1
    ? getEndTime(dayKey, timeslot.startTime, endTimeRaw, subSessionsLen, subSessionIndex + 1)
    : endTimeRaw;
};

/**
 * Get the host machine's current timezone suffix (e.g. "GMT-0500 (EST)") so that
 * `date`/`startTime`/`endTime` strings, which carry no timezone of their own, are parsed
 * consistently by the `Date` constructor.
 */
function getLocalTimezoneSuffix(): string {
  return new Date().toString().match(/([A-Z]+[+-][0-9]+.*)/)[1];
}

function toLocalTimestamp(date: string, time: string): number {
  return new Date(`${date} ${time} ${getLocalTimezoneSuffix()}`).getTime();
}

const getEndTime = (
  date: string,
  startTime: string,
  endTime: string,
  totalNumber: number,
  number: number,
) => {
  const timeStart = toLocalTimestamp(date, startTime);
  const difference = Math.floor(getTimeDifference(date, startTime, endTime) / totalNumber);
  const result = new Date(timeStart + difference * number);
  return result.getHours() + ':' + result.getMinutes();
};

function getTimeDifference(date: string, startTime: string, endTime: string) {
  return toLocalTimestamp(date, endTime) - toLocalTimestamp(date, startTime);
}

export function getDuration(date: string, startTime: string, endTime: string) {
  let difference = getTimeDifference(date, startTime, endTime);
  const hh = Math.floor(difference / 1000 / 60 / 60);
  difference -= hh * 1000 * 60 * 60;
  return {
    hh,
    mm: Math.floor(difference / 1000 / 60),
  };
}

export const collectSpeakers = (speakerIds: string[], speakersRaw: SpeakerMap) => {
  return (speakerIds || []).map((speakerId) => {
    return {
      id: speakerId,
      ...speakersRaw[speakerId],
      sessions: null,
    };
  });
};
