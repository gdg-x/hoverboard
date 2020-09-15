import firebase from 'firebase';
import { blogActions } from './blog';
import { dialogsActions } from './dialogs';
import { feedbackActions } from './feedback';
import { galleryActions } from './gallery';
import { helperActions } from './helper';
import { notificationsActions } from './notifications';
import { partnersActions } from './partners';
import { previousSpeakersActions } from './previous-speakers';
import { routingActions } from './routing';
import { scheduleActions } from './schedule';
import { sessionsActions } from './sessions';
import { speakersActions } from './speakers';
import { subscribeActions } from './subscribe';
import { teamActions } from './team';
import { ticketsActions } from './tickets';
import { toastActions } from './toast';
import { uiActions } from './ui';
import { userActions } from './user';
import { videosActions } from './videos';

export {
  blogActions,
  dialogsActions,
  feedbackActions,
  galleryActions,
  helperActions,
  notificationsActions,
  partnersActions,
  previousSpeakersActions,
  routingActions,
  scheduleActions,
  sessionsActions,
  speakersActions,
  subscribeActions,
  teamActions,
  ticketsActions,
  toastActions,
  uiActions,
  userActions,
  videosActions,
};

// TODO: Remove type
declare global {
  interface Window {
    firebase: typeof firebase;
  }
}
