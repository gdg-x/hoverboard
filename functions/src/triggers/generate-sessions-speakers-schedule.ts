// https://github.com/import-js/eslint-plugin-import/issues/1810

import { DocumentData, getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { sessionsSpeakersMap } from '../schedule-generator/speakers-sessions-map.js';
import { sessionsSpeakersScheduleMap } from '../schedule-generator/speakers-sessions-schedule-map.js';
import {
  isEmpty,
  ScheduleMap,
  SessionMap,
  snapshotToObject,
  SpeakerMap,
} from '../utils/firestore.js';
import { RawScheduleDay } from '../utils/schedule-time.js';

type ChangedSpeaker = DocumentData & { id: string };

interface GeneratedData {
  sessions?: Record<string, unknown>;
  speakers?: Record<string, unknown>;
  schedule?: Record<string, unknown>;
}

const isScheduleEnabled = async (): Promise<boolean> => {
  const doc = await getFirestore().collection('config').doc('schedule').get();

  if (doc.exists) {
    const data = doc.data();
    return data?.enabled === 'true' || data?.enabled === true;
  } else {
    logger.error(
      'Schedule config is not set. Set the `config/schedule.enabled=true` Firestore value.',
    );
    return false;
  }
};

export const sessionsWrite = onDocumentWritten('sessions/{sessionId}', () => generateAndSaveData());

export const scheduleWrite = onDocumentWritten('schedule/{scheduleId}', async () => {
  if (await isScheduleEnabled()) {
    return generateAndSaveData();
  }
  return null;
});

export const speakersWrite = onDocumentWritten('speakers/{speakerId}', async (event) => {
  const changedSpeaker: ChangedSpeaker | null = event.data?.after.exists
    ? { id: event.params.speakerId, ...event.data.after.data() }
    : null;
  return generateAndSaveData(changedSpeaker);
});

const fetchData = () => {
  const sessionsPromise = getFirestore().collection('sessions').get();
  const schedulePromise = getFirestore().collection('schedule').orderBy('date', 'desc').get();
  const speakersPromise = getFirestore().collection('speakers').get();

  return Promise.all([sessionsPromise, schedulePromise, speakersPromise]);
};

async function generateAndSaveData(changedSpeaker?: ChangedSpeaker | null) {
  const [sessionsSnapshot, scheduleSnapshot, speakersSnapshot] = await fetchData();

  const sessions = snapshotToObject(sessionsSnapshot);
  const schedule = snapshotToObject(scheduleSnapshot);
  const speakers = snapshotToObject(speakersSnapshot);

  let generatedData: GeneratedData = {};
  if (!Object.keys(sessions).length) {
    generatedData.speakers = { ...speakers };
  } else if (!(await isScheduleEnabled()) || !Object.keys(schedule).length) {
    generatedData = sessionsSpeakersMap(sessions, speakers);
  } else {
    generatedData = sessionsSpeakersScheduleMap(
      sessions,
      speakers,
      schedule as Record<string, RawScheduleDay>,
    );
  }

  // If changed speaker does not have assigned session(s) yet
  if (changedSpeaker && generatedData.speakers && !generatedData.speakers[changedSpeaker.id]) {
    generatedData.speakers[changedSpeaker.id] = changedSpeaker;
  }

  saveGeneratedData(generatedData.sessions, 'generatedSessions');
  saveGeneratedData(generatedData.speakers, 'generatedSpeakers');
  saveGeneratedData(generatedData.schedule, 'generatedSchedule');
}

function saveGeneratedData(
  data: Record<string, unknown> | SessionMap | SpeakerMap | ScheduleMap | undefined,
  collectionName: string,
) {
  if (!data || isEmpty(data)) {
    logger.error(`Attempting to write empty data to Firestore collection: "${collectionName}".`);
    return;
  }

  for (let index = 0; index < Object.keys(data).length; index++) {
    const key = Object.keys(data)[index]!;
    getFirestore().collection(collectionName).doc(key).set(data[key]);
  }
}
