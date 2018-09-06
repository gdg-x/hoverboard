import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import mapSessionsSpeakersSchedule from './schedule-generator/speakers-sessions-schedule-map'
import mapSessionsSpeakers from './schedule-generator/speakers-sessions-map'

export const sessionsWrite = functions.firestore.document('sessions/{sessionId}').onWrite( async (change, context) => {
    return generateAndSaveData();
});

export const scheduleWrite = functions.firestore.document('schedule/{scheduleId}').onWrite( async (change, context) => {
    return generateAndSaveData();
});

export const speakersWrite = functions.firestore.document('speakers/{speakerId}').onWrite( async (change, context) => {
    return generateAndSaveData();
});

async function generateAndSaveData() {
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

    let generatedData = {}
    const scheduleConfig = functions.config().schedule;
    const scheduleEnabled = scheduleConfig && scheduleConfig.enabled === 'true';

    if (!Object.keys(sessions).length) {
        generatedData = Object.assign({}, speakers);
    }
    else if (!Object.keys(schedule).length || !scheduleEnabled) {
        generatedData = mapSessionsSpeakers(sessions, speakers);
    }
    else {
        generatedData = mapSessionsSpeakersSchedule(sessions, schedule, speakers);
    }

    saveGeneratedSessions(generatedData.sessions);
    saveGeneratedSpeakers(generatedData.speakers);
    saveGeneratedSchedule(generatedData.schedule);
}

function saveGeneratedSessions(sessions) {
    if (!sessions || !Object.keys(sessions).length) return;

    Object.keys(sessions).forEach((key) => {
        firestore().collection('generatedSessions')
            .doc(key)
            .set(sessions[key])
    });
}

function saveGeneratedSpeakers(speakers) {
    if (!speakers || !Object.keys(speakers).length) return;

    Object.keys(speakers).forEach((key) => {
        firestore().collection('generatedSpeakers')
            .doc(key)
            .set(speakers[key])
    });
}

function saveGeneratedSchedule(schedule) {
    if (!schedule || !Object.keys(schedule).length) return;

    Object.keys(schedule).forEach((key) => {
        firestore().collection('generatedSchedule')
            .doc(key)
            .set(schedule[key])
    });
}