'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

exports.sendGeneralNotification = require('./notifications');
exports.scheduleNotifications = require('./schedule-notifications');
exports.saveUserData = require('./users');

