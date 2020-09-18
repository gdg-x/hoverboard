import firebase from 'firebase';
import { helperActions } from './helper';
import { notificationsActions } from './notifications';
import { partnersActions } from './partners';
import { previousSpeakersActions } from './previous-speakers';
import { routingActions } from './routing';
import { scheduleActions } from './schedule';
import { sessionsActions } from './sessions';
import { speakersActions } from './speakers';
import { teamActions } from './team';
import { userActions } from './user';

export {
  helperActions,
  notificationsActions,
  partnersActions,
  previousSpeakersActions,
  routingActions,
  scheduleActions,
  sessionsActions,
  speakersActions,
  teamActions,
  userActions,
};

// TODO: Remove type
declare global {
  interface Window {
    firebase: typeof firebase;
  }
}
