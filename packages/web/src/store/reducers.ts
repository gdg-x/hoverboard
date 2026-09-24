import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './auth';
import blogReducer from './blog';
import dialogsReducer from './dialogs';
import featuredSessionsReducer from './featured-sessions';
import feedback from './feedback';
import filtersReducer from './filters';
import galleryReducer from './gallery';
import membersReducer from './members';
import notificationPermission from './notification-permission';
import notificationsSubscribersReducer from './notifications-subscribers';
import notificationsUsersReducer from './notifications-users';
import partners from './partners';
import potentialPartnersReducer from './potential-partners';
import previousSpeakersReducer from './previous-speakers';
import scheduleReducer from './schedule';
import sessionsReducer from './sessions';
import snackbars from './snackbars';
import speakersReducer from './speakers';
import subscribeReducer from './subscribe';
import teamsReducer from './teams';
import ticketsReducer from './tickets';
import uiReducer from './ui';
import updateNotificationsSubscribersReducer from './update-notifications-subscribers';
import updateNotificationsUsersReducer from './update-notifications-users';
import userReducer from './user';
import videosReducer from './videos';

export const reducers = combineReducers({
  auth: authReducer,
  blog: blogReducer,
  dialogs: dialogsReducer,
  featuredSessions: featuredSessionsReducer,
  feedback,
  filters: filtersReducer,
  gallery: galleryReducer,
  members: membersReducer,
  notificationPermission,
  notificationsSubscribers: notificationsSubscribersReducer,
  notificationsUsers: notificationsUsersReducer,
  partners,
  potentialPartners: potentialPartnersReducer,
  previousSpeakers: previousSpeakersReducer,
  schedule: scheduleReducer,
  sessions: sessionsReducer,
  snackbars,
  speakers: speakersReducer,
  subscribed: subscribeReducer,
  teams: teamsReducer,
  tickets: ticketsReducer,
  ui: uiReducer,
  updateNotificationsSubscribers: updateNotificationsSubscribersReducer,
  updateNotificationsUsers: updateNotificationsUsersReducer,
  user: userReducer,
  videos: videosReducer,
});
