// https://github.com/import-js/eslint-plugin-import/issues/1810
// eslint-disable-next-line import/no-unresolved
import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import { sessionsSpeakersMap } from './schedule-generator/speakers-sessions-map.js';
import { sessionsSpeakersScheduleMap } from './schedule-generator/speakers-sessions-schedule-map.js';
import { isEmpty, ScheduleMap, SessionMap, snapshotToObject, SpeakerMap } from './utils.js';

const isScheduleEnabled = async (): Promise<boolean> => {
  const doc = await getFirestore().collection('config').doc('schedule').get();

  if (doc.exists) {
    return doc.data().enabled === 'true' || doc.data().enabled === true;
  } else {
    functions.logger.error(
      'Schedule config is not set. Set the `config/schedule.enabled=true` Firestore value.'
    );
    return false;
  }
};

export const sessionsWrite = functions.firestore
  .document('sessions/{sessionId}')
  .onWrite(() => generateAndSaveData());

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

const fetchData = () => {
  const sessionsPromise = getFirestore().collection('sessions').get();
  const schedulePromise = getFirestore().collection('schedule').orderBy('date', 'desc').get();
  const speakersPromise = getFirestore().collection('speakers').get();

  return Promise.all([sessionsPromise, schedulePromise, speakersPromise]);
};

async function generateAndSaveData(changedSpeaker?) {
  const [sessionsSnapshot, scheduleSnapshot, speakersSnapshot] = await fetchData();

  const sessions = snapshotToObject(sessionsSnapshot);
  const schedule = snapshotToObject(scheduleSnapshot);
  const speakers = snapshotToObject(speakersSnapshot);

  let generatedData: {
    sessions?: {};
    speakers?: {};
    schedule?: {};
  } = {};
  if (!Object.keys(sessions).length) {
    generatedData.speakers = { ...speakers };
  } else if (!(await isScheduleEnabled()) || !Object.keys(schedule).length) {
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

function saveGeneratedData(data: SessionMap | SpeakerMap | ScheduleMap, collectionName: string) {
  if (isEmpty(data)) {
    functions.logger.error(
      `Attempting to write empty data to Firestore collection: "${collectionName}".`
    );
    return;
  }

  for (let index = 0; index < Object.keys(data).length; index++) {
    const key = Object.keys(data)[index];
    getFirestore().collection(collectionName).doc(key).set(data[key]);
  }
}
