import firebase from 'firebase';
import { helperActions } from './helper';
import { notificationsActions } from './notifications';
import { previousSpeakersActions } from './previous-speakers';
import { routingActions } from './routing';
import { scheduleActions } from './schedule';
import { sessionsActions } from './sessions';
import { speakersActions } from './speakers';
import { userActions } from './user';

export {
  helperActions,
  notificationsActions,
  previousSpeakersActions,
  routingActions,
  scheduleActions,
  sessionsActions,
  speakersActions,
  userActions,
};

// TODO: Remove type
declare global {
  interface Window {
    firebase: typeof firebase;
  }
}
