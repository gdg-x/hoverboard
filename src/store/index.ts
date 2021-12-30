import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from './auth/reducers';
import { blogReducer } from './blog/reducers';
import { dialogsReducer } from './dialogs/reducers';
import { featuredSessionsReducer } from './featured-sessions/reducers';
import { feedbackReducer } from './feedback/reducers';
import { filtersReducer } from './filters/reducers';
import { galleryReducer } from './gallery/reducers';
import { membersReducer } from './members/reducers';
import { notificationsReducer } from './notifications/reducers';
import { partnersReducer } from './partners/reducers';
import { potentialPartnersReducer } from './potential-partners/reducers';
import { previousSpeakersReducer } from './previous-speakers/reducers';
import { scheduleReducer } from './schedule/reducers';
import { sessionsReducer } from './sessions/reducers';
import { speakersReducer } from './speakers/reducers';
import { subscribeReducer } from './subscribe/reducers';
import { teamsReducer } from './teams/reducers';
import { ticketsReducer } from './tickets/reducers';
import { toastReducer } from './toast/reducers';
import { uiReducer } from './ui/reducers';
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
    feedback: feedbackReducer,
    filters: filtersReducer,
    gallery: galleryReducer,
    members: membersReducer,
    notifications: notificationsReducer,
    partners: partnersReducer,
    potentialPartners: potentialPartnersReducer,
    previousSpeakers: previousSpeakersReducer,
    schedule: scheduleReducer,
    sessions: sessionsReducer,
    speakers: speakersReducer,
    subscribed: subscribeReducer,
    teams: teamsReducer,
    tickets: ticketsReducer,
    toast: toastReducer,
    ui: uiReducer,
    user: userReducer,
    videos: videosReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
