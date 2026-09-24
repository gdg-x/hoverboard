// https://github.com/import-js/eslint-plugin-import/issues/1810

import type { DocumentData, QuerySnapshot } from 'firebase-admin/firestore';
// Importing the actual frontend models (`Schedule`, `Session`, `Speaker` from
// `../../../src/models/*`) would pull those files into this package's TypeScript
// program and change the emitted `dist` structure, so these are typed against the
// real Firestore document shape (`DocumentData`) plus the specific fields the
// schedule generator reads off raw session/speaker documents.
// import type { Schedule } from '../../../src/models/schedule';
// import type { Session } from '../../../src/models/session';
// import type { Speaker } from '../../../src/models/speaker';

export interface RawSessionData extends DocumentData {
  speakers?: string[];
  tags?: string[];
}

export interface SessionMap {
  [id: string]: RawSessionData;
}

export type ScheduleMap = DocumentData;

export interface SpeakerMap {
  [id: string]: DocumentData;
}

export const snapshotToObject = (
  snapshot: QuerySnapshot<DocumentData>,
): Record<string, DocumentData> => {
  return snapshot.docs.reduce((data: Record<string, DocumentData>, doc) => {
    data[doc.id] = doc.data();
    return data;
  }, {});
};

export const isEmpty = (obj: object) => {
  return obj === undefined || obj === null || Object.keys(obj).length === 0;
};
