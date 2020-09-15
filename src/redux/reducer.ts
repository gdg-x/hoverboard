import { combineReducers } from 'redux';
import { blogReducer } from './reducers/blog';
import { dialogsReducer } from './reducers/dialogs';
import { feedbackReducer } from './reducers/feedback';
import { filtersReducer } from './reducers/filters';
import { galleryReducer } from './reducers/gallery';
import { notificationsReducer } from './reducers/notifications';
import { partnersReducer } from './reducers/partners';
import { previousSpeakersReducer } from './reducers/previous-speakers';
import { routingReducer } from './reducers/routing';
import { scheduleReducer } from './reducers/schedule';
import { sessionsReducer } from './reducers/sessions';
import { speakersReducer } from './reducers/speakers';
import { subscribeReducer } from './reducers/subscribe';
import { teamReducer } from './reducers/team';
import { ticketsReducer } from './reducers/tickets';
import { toastReducer } from './reducers/toast';
import { uiReducer } from './reducers/ui';
import { userReducer } from './reducers/user';
import { videosReducer } from './reducers/videos';

export const appReducer = combineReducers({
  blog: blogReducer,
  dialogs: dialogsReducer,
  feedback: feedbackReducer,
  filters: filtersReducer,
  gallery: galleryReducer,
  notifications: notificationsReducer,
  partners: partnersReducer,
  previousSpeakers: previousSpeakersReducer,
  routing: routingReducer,
  schedule: scheduleReducer,
  sessions: sessionsReducer,
  speakers: speakersReducer,
  subscribed: subscribeReducer,
  team: teamReducer,
  tickets: ticketsReducer,
  toast: toastReducer,
  ui: uiReducer,
  user: userReducer,
  videos: videosReducer,
});
