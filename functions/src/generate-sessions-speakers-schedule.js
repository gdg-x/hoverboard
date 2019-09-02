import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import mapSessionsSpeakersSchedule from './schedule-generator/speakers-sessions-schedule-map';
import mapSessionsSpeakers from './schedule-generator/speakers-sessions-map';

export const sessionsWrite = functions.firestore.document('sessions/{sessionId}').onWrite(async () => {
  return generateAndSaveData();
});

export const scheduleWrite = functions.firestore.document('schedule/{scheduleId}').onWrite(async () => {
  const scheduleConfig = functions.config().schedule;
  if (!scheduleConfig || typeof scheduleConfig.enabled === 'undefined') {
    console.error('Schedule config is NOT set! Run `firebase functions:config:set schedule.enabled=true`, redeploy functions and try again.');
    return null;
  }
  if(scheduleConfig.enabled === 'true') {
    return generateAndSaveData();
  }
  return null;
});

export const speakersWrite = functions.firestore.document('speakers/{speakerId}').onWrite(async (change, context) => {
  const changedSpeaker = change.after.exists ? { id: context.params.speakerId, ...change.after.data() } : null;
  return generateAndSaveData(changedSpeaker);
});

async function generateAndSaveData(changedSpeaker) {
  const sessionsPromise = firestore().collection('sessions').get();
  const schedulePromise = firestore().collection('schedule').orderBy('date', 'desc').get();
  const speakersPromise = firestore().collection('speakers').get();

  const [sessionsSnapshot, scheduleSnapshot, speakersSnapshot] = await Promise.all([sessionsPromise, schedulePromise, speakersPromise]);

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

  let generatedData = {};
  const scheduleConfig = functions.config().schedule;
  if (!scheduleConfig || typeof scheduleConfig.enabled === 'undefined') {
    console.error('Schedule config is NOT set! Run `firebase functions:config:set schedule.enabled=true`, redeploy functions and try again.');
    return null;
  }
  const scheduleEnabled = scheduleConfig.enabled === 'true';

  if (!Object.keys(sessions).length) {
    generatedData = { ...speakers };
  } else if (!scheduleEnabled || !Object.keys(schedule).length) {
    generatedData = mapSessionsSpeakers(sessions, speakers);
  } else {
    generatedData = mapSessionsSpeakersSchedule(sessions, speakers, schedule);
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
    firestore().collection(collectionName)
      .doc(key)
      .set(data[key]);
  }
}
