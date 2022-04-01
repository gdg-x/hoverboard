// https://github.com/import-js/eslint-plugin-import/issues/1810
// eslint-disable-next-line import/no-unresolved
import type { DocumentData, QuerySnapshot } from 'firebase-admin/firestore';
// TODO: import actual types. Currently importing them changes `dist` structure.
// import type { Schedule } from '../../src/models/schedule';
// import type { Session } from '../../src/models/session';
// import type { Speaker } from '../../src/models/speaker';

// TODO: Remove TempAny
type TempAny = any;
type Session = TempAny;
type Schedule = TempAny;
type Speaker = TempAny;

export interface SessionMap {
  [id: string]: Session;
}

export type ScheduleMap = Schedule;

export interface SpeakerMap {
  [id: string]: Speaker;
}

export const pickMainTag = (tags?: string[]): string => {
  return tags?.[0] || 'General';
};

export const combineTags = (speakerTags?: string[], sessionTags?: string[]): string[] => {
  const tags = [...(speakerTags || []), ...(sessionTags || [])];
  return [...new Set(tags)];
};

export const snapshotToObject = (snapshot: QuerySnapshot<DocumentData>) => {
  return snapshot.docs.reduce((data, doc) => {
    data[doc.id] = doc.data();
    return data;
  }, {});
};

export const isEmpty = (obj: object) => {
  return obj === undefined || obj === null || Object.keys(obj).length === 0;
};

export const calculateStartTime = (
  subSessionsLen: number,
  subSessionIndex: number,
  sessionIndex: number,
  sessions: any,
  timeslot: any
) => {
  return subSessionsLen > 1 && subSessionIndex > 0
    ? sessions[timeslot.sessions[sessionIndex].items[subSessionIndex - 1]].endTime
    : timeslot.startTime;
};

export const calculateEndTime = (
  subSessionsLen: number,
  timeslot: any,
  sessionIndex: number,
  day: any,
  timeslotsIndex: number,
  dayKey: string,
  subSessionIndex: number
) => {
  const endTimeRaw = timeslot.sessions[sessionIndex].extend
    ? day.timeslots[timeslotsIndex + timeslot.sessions[sessionIndex].extend - 1].endTime
    : timeslot.endTime;

  return subSessionsLen > 1
    ? getEndTime(dayKey, timeslot.startTime, endTimeRaw, subSessionsLen, subSessionIndex + 1)
    : endTimeRaw;
};

const getEndTime = (
  date: string,
  startTime: string,
  endTime: string,
  totalNumber: number,
  number: number
) => {
  const timezone = new Date().toString().match(/([A-Z]+[+-][0-9]+.*)/)[1];
  const timeStart = new Date(`${date} ${startTime} ${timezone}`).getTime();
  const difference = Math.floor(getTimeDifference(date, startTime, endTime) / totalNumber);
  const result = new Date(timeStart + difference * number);
  return result.getHours() + ':' + result.getMinutes();
};

function getTimeDifference(date: string, startTime: string, endTime: string) {
  const timezone = new Date().toString().match(/([A-Z]+[+-][0-9]+.*)/)[1];
  const timeStart = new Date(date + ' ' + startTime + ' ' + timezone).getTime();
  const timeEnd = new Date(date + ' ' + endTime + ' ' + timezone).getTime();
  return timeEnd - timeStart;
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

export const collectSpeakers = (speakerIds: string[], speakersRaw: any) => {
  return (speakerIds || []).map((speakerId) => {
    return {
      id: speakerId,
      ...speakersRaw[speakerId],
      sessions: null,
    };
  });
};
