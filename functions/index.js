'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

exports.saveUserData = require('./users');

const scheduleGenerator = require('./schedule-generator-helper.js').generateSchedule;

exports.scheduleWrite = functions.database
    .ref("/schedule").onWrite(event => {

        const schedulePromise = event.data;
        const sessionsPromise = admin.database().ref('/sessions').once('value');
        const speakersPromise = admin.database().ref('/speakers').once('value');

        return generateScheduleOnChange(schedulePromise, sessionsPromise, speakersPromise);
    });


exports.sessionsWrite = functions.database
    .ref("/sessions").onWrite(event => {
        const sessionsPromise = event.data;
        const schedulePromise = admin.database().ref('/schedule').once('value');
        const speakersPromise = admin.database().ref('/speakers').once('value');

        return generateScheduleOnChange(schedulePromise, sessionsPromise, speakersPromise);
    });

exports.speakersWrite = functions.database
    .ref("/speakers").onWrite(event => {
        const speakersPromise = event.data;
        const sessionsPromise = admin.database().ref('/sessions').once('value');
        const schedulePromise = admin.database().ref('/schedule').once('value');

        return generateScheduleOnChange(schedulePromise, sessionsPromise, speakersPromise);
    });

function generateScheduleOnChange(schedulePromise, sessionsPromise, speakersPromise) {
    return Promise.all([schedulePromise, sessionsPromise, speakersPromise])
        .then(([scheduleSnapshot, sessionsSnapshot, speakersSnapshot]) => {

            const scheduleDB = scheduleSnapshot.val();
            const sessionsDB = sessionsSnapshot.val();
            const speakersDB = speakersSnapshot.val();

            const {
                schedule,
                sessions,
                speakers
            } = scheduleGenerator(scheduleDB, sessionsDB, speakersDB);

            admin.database().ref('/generated/schedule').set(schedule);
            admin.database().ref('/generated/sessions').set(sessions);
            admin.database().ref('/generated/speakers').set(speakers);

        })
        .catch(e => console.log('Error at schedule genaration', e));
}