// https://github.com/import-js/eslint-plugin-import/issues/1810
// eslint-disable-next-line import/no-unresolved
import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import { sessionsSpeakersMap } from './schedule-generator/speakers-sessions-map.js';
import { sessionsSpeakersScheduleMap } from './schedule-generator/speakers-sessions-schedule-map.js';

const isScheduleEnabled = async (): Promise<boolean> => {
  const doc = await getFirestore().collection('config').doc('schedule').get();

  if (doc.exists) {
    return doc.data().enabled === 'true' || doc.data().enabled === true;
  } else {
    console.error(
      'Schedule config is not set. Set `config/schedule.enabled=true` Firestore value.'
    );
    return false;
  }
};

export const sessionsWrite = functions.firestore
  .document('sessions/{sessionId}')
  .onWrite(async () => {
    return generateAndSaveData();
  });

export const scheduleWrite = functions.firestore
  .document('schedule/{scheduleId}')
  .onWrite(async () => {
    if (await isScheduleEnabled()) {
      return generateAndSaveData();
    }
    return null;
  });

export const speakersWrite = functions.firestore
  .document('speakers/{speakerId}')
  .onWrite(async (change, context) => {
    const changedSpeaker = change.after.exists
      ? { id: context.params.speakerId, ...change.after.data() }
      : null;
    return generateAndSaveData(changedSpeaker);
  });

async function generateAndSaveData(changedSpeaker?) {
  const sessionsPromise = getFirestore().collection('sessions').get();
  const schedulePromise = getFirestore().collection('schedule').orderBy('date', 'desc').get();
  const speakersPromise = getFirestore().collection('speakers').get();

  const [sessionsSnapshot, scheduleSnapshot, speakersSnapshot] = await Promise.all([
    sessionsPromise,
    schedulePromise,
    speakersPromise,
  ]);

  const sessions = {};
  const schedule = {};
  const speakers = {};

  sessionsSnapshot.forEach((doc) => {
    sessions[doc.id] = doc.data();
  });

  scheduleSnapshot.forEach((doc) => {
    schedule[doc.id] = doc.data();
  });

  speakersSnapshot.forEach((doc) => {
    speakers[doc.id] = doc.data();
  });

  let generatedData: {
    sessions?: {};
    speakers?: {};
    schedule?: {};
  } = {};
  if (!Object.keys(sessions).length) {
    generatedData.speakers = { ...speakers };
  } else if ((await isScheduleEnabled()) || !Object.keys(schedule).length) {
    generatedData = sessionsSpeakersMap(sessions, speakers);
  } else {
    generatedData = sessionsSpeakersScheduleMap(sessions, speakers, schedule);
  }

  // If changed speaker does not have assigned session(s) yet
  if (changedSpeaker && !generatedData.speakers[changedSpeaker.id]) {
    generatedData.speakers[changedSpeaker.id] = changedSpeaker;
  }

  saveGeneratedData(generatedData.sessions, 'generatedSessions');
  saveGeneratedData(generatedData.speakers, 'generatedSpeakers');
  saveGeneratedData(generatedData.schedule, 'generatedSchedule');
}

function saveGeneratedData(data, collectionName) {
  if (!data || !Object.keys(data).length) return;

  for (let index = 0; index < Object.keys(data).length; index++) {
    const key = Object.keys(data)[index];
    getFirestore().collection(collectionName).doc(key).set(data[key]);
  }
}
