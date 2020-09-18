import firebase from 'firebase';
import { helperActions } from './helper';
import { sessionsActions } from './sessions';

export { helperActions, sessionsActions };

// TODO: Remove type
declare global {
  interface Window {
    firebase: typeof firebase;
  }
}
