import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import generateSchedule from './schedule-generator-helper'

export const sessionsWrite = functions.firestore.document('sessions/{sessionId}').onWrite( async (change, context) => {
    return generateAndSaveScheduleData();
});

export const scheduleWrite = functions.firestore.document('schedule/{scheduleId}').onWrite( async (change, context) => {
    return generateAndSaveScheduleData();
});

export const speakersWrite = functions.firestore.document('speakers/{speakerId}').onWrite( async (change, context) => {
    return generateAndSaveScheduleData();
});

async function generateAndSaveScheduleData() {
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

    const generatedData = generateSchedule(sessions, schedule, speakers);


    Object.keys(generatedData.sessions).forEach((key) => {
        firestore().collection('generatedSessions')
        .doc(key)
        .set(generatedData.sessions[key]) 
    });

    Object.keys(generatedData.schedule).forEach((key) => {
        firestore().collection('generatedSchedule')
        .doc(key)
        .set(generatedData.schedule[key]) 
    });

    Object.keys(generatedData.speakers).forEach((key) => {
        // if (key === 'adrian_kajda') {
        //     console.log('andrian_kajda', generatedData.speakers[key].sessions)

        // }
        firestore().collection('generatedSpeakers')
        .doc(key)
        .set(generatedData.speakers[key]) 
    });
}