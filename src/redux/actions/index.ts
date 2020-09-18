import firebase from 'firebase';
import { helperActions } from './helper';
import { sessionsActions } from './sessions';
import { speakersActions } from './speakers';

export { helperActions, sessionsActions, speakersActions };

// TODO: Remove type
declare global {
  interface Window {
    firebase: typeof firebase;
  }
}
