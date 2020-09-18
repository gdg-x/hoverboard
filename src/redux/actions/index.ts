import firebase from 'firebase';
import { sessionsActions } from './sessions';

export { sessionsActions };

// TODO: Remove type
declare global {
  interface Window {
    firebase: typeof firebase;
  }
}
