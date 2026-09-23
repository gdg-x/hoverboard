// https://github.com/import-js/eslint-plugin-import/issues/1810

import type { DocumentData, QuerySnapshot } from 'firebase-admin/firestore';
// TODO: import actual types. Currently importing them changes `dist` structure.
// import type { Schedule } from '../../../src/models/schedule';
// import type { Session } from '../../../src/models/session';
// import type { Speaker } from '../../../src/models/speaker';

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

export const snapshotToObject = (snapshot: QuerySnapshot<DocumentData>) => {
  return snapshot.docs.reduce((data, doc) => {
    data[doc.id] = doc.data();
    return data;
  }, {});
};

export const isEmpty = (obj: object) => {
  return obj === undefined || obj === null || Object.keys(obj).length === 0;
};
