import { blogReducer } from './blog/reducers';
import { dialogsReducer } from './dialogs/reducers';
import { feedbackReducer } from './feedback/reducers';
import { filtersReducer } from './filters/reducers';
import { galleryReducer } from './gallery/reducers';
import { initialState } from './initial-state';
import { notificationsReducer } from './notifications/reducers';
import { partnersReducer } from './partners/reducers';
import { previousSpeakersReducer } from './reducers/previous-speakers';
import { routingReducer } from './routing/reducers';
import { scheduleReducer } from './reducers/schedule';
import { sessionsReducer } from './reducers/sessions';
import { speakersReducer } from './reducers/speakers';
import { subscribeReducer } from './subscribe/reducers';
import { teamReducer } from './team/reducers';
import { userReducer } from './reducers/user';
import { ticketsReducer } from './tickets/reducers';
import { toastReducer } from './toast/reducers';
import { uiReducer } from './ui/reducers';
import { videosReducer } from './videos/reducers';

export const appReducer = (state = initialState, action) => {
  return {
    ui: uiReducer(state.ui, action),
    routing: routingReducer(state.routing, action),
    dialogs: dialogsReducer(state.dialogs, action),
    tickets: ticketsReducer(state.tickets, action),
    partners: partnersReducer(state.partners, action),
    feedback: feedbackReducer(state.feedback, action),
    videos: videosReducer(state.videos, action),
    blog: blogReducer(state.blog, action),
    speakers: speakersReducer(state.speakers, action),
    previousSpeakers: previousSpeakersReducer(state.previousSpeakers, action),
    sessions: sessionsReducer(state.sessions, action),
    schedule: scheduleReducer(state.schedule, action),
    gallery: galleryReducer(state.gallery, action),
    team: teamReducer(state.team, action),
    user: userReducer(state.user, action),
    subscribed: subscribeReducer(state.subscribed, action),
    toast: toastReducer(state.toast, action),
    notifications: notificationsReducer(state.notifications, action),
    filters: filtersReducer(state.filters, action),
  };
};
