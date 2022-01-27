import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from './auth/reducers';
import { blogReducer } from './blog/reducers';
import { dialogsReducer } from './dialogs/reducers';
import { featuredSessionsReducer } from './featured-sessions/reducers';
import { filtersReducer } from './filters/reducers';
import { galleryReducer } from './gallery/reducers';
import { membersReducer } from './members/reducers';
import notificationPermission from './notification-permission';
import { notificationsSubscribersReducer } from './notifications-subscribers/reducers';
import { notificationsUsersReducer } from './notifications-users/reducers';
import { partnersReducer } from './partners/reducers';
import { potentialPartnersReducer } from './potential-partners/reducers';
import { previousSpeakersReducer } from './previous-speakers/reducers';
import { scheduleReducer } from './schedule/reducers';
import { sessionsReducer } from './sessions/reducers';
import snackbars from './snackbars';
import feedback from './feedback';
import { speakersReducer } from './speakers/reducers';
import { subscribeReducer } from './subscribe/reducers';
import { teamsReducer } from './teams/reducers';
import { ticketsReducer } from './tickets/reducers';
import { uiReducer } from './ui/reducers';
import { updateNotificationsSubscribersReducer } from './update-notifications-subscribers/reducers';
import { updateNotificationsUsersReducer } from './update-notifications-users/reducers';
import { userReducer } from './user/reducers';
import { videosReducer } from './videos/reducers';

export const store = configureStore({
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  reducer: {
    auth: authReducer,
    blog: blogReducer,
    dialogs: dialogsReducer,
    featuredSessions: featuredSessionsReducer,
    feedback,
    filters: filtersReducer,
    gallery: galleryReducer,
    members: membersReducer,
    snackbars,
    notificationPermission,
    notificationsSubscribers: notificationsSubscribersReducer,
    notificationsUsers: notificationsUsersReducer,
    partners: partnersReducer,
    potentialPartners: potentialPartnersReducer,
    previousSpeakers: previousSpeakersReducer,
    schedule: scheduleReducer,
    sessions: sessionsReducer,
    speakers: speakersReducer,
    subscribed: subscribeReducer,
    teams: teamsReducer,
    tickets: ticketsReducer,
    ui: uiReducer,
    updateNotificationsSubscribers: updateNotificationsSubscribersReducer,
    updateNotificationsUsers: updateNotificationsUsersReducer,
    user: userReducer,
    videos: videosReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
