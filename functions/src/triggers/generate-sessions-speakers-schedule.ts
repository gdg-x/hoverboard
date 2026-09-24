// https://github.com/import-js/eslint-plugin-import/issues/1810

import type { DocumentData } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { fetchConfig } from '../db/config.js';
import { saveGeneratedSchedule } from '../db/generated-schedule.js';
import { saveGeneratedSessions } from '../db/generated-sessions.js';
import { saveGeneratedSpeakers } from '../db/generated-speakers.js';
import { fetchSchedule } from '../db/schedule.js';
import { fetchSessions } from '../db/sessions.js';
import { fetchSpeakers } from '../db/speakers.js';
import { sessionsSpeakersMap } from '../schedule-generator/speakers-sessions-map.js';
import { sessionsSpeakersScheduleMap } from '../schedule-generator/speakers-sessions-schedule-map.js';
import { snapshotToObject } from '../utils/firestore.js';
import { RawScheduleDay } from '../utils/schedule-time.js';

type ChangedSpeaker = DocumentData & { id: string };

interface GeneratedData {
  sessions?: Record<string, unknown>;
  speakers?: Record<string, unknown>;
  schedule?: Record<string, unknown>;
}

const isScheduleEnabled = async (): Promise<boolean> => {
  const doc = await fetchConfig('schedule');

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
  return Promise.all([fetchSessions(), fetchSchedule(), fetchSpeakers()]);
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

  saveGeneratedSessions(generatedData.sessions);
  saveGeneratedSpeakers(generatedData.speakers);
  saveGeneratedSchedule(generatedData.schedule);
}
