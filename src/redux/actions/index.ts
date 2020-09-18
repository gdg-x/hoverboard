import firebase from 'firebase';
import { helperActions } from './helper';
import { sessionsActions } from './sessions';
import { speakersActions } from './speakers';
import { userActions } from './user';

export { helperActions, sessionsActions, speakersActions, userActions };

// TODO: Remove type
declare global {
  interface Window {
    firebase: typeof firebase;
  }
}
