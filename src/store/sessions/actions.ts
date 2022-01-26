import { Initialized, Success } from '@abraham/remotedata';
import { orderBy } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { Session } from '../../models/session';
import { subscribeToCollection, Subscription } from '../../utils/firestore';
import {
  FETCH_SESSIONS,
  FETCH_SESSIONS_FAILURE,
  FETCH_SESSIONS_SUCCESS,
  SessionsActions,
} from './types';

let subscription: Subscription = new Initialized();

export const unsubscribe = () => {
  if (subscription instanceof Success) {
    subscription.data();
  }
};

export const fetchSessions = async (dispatch: Dispatch<SessionsActions>) => {
  if (subscription instanceof Initialized) {
    subscription = subscribeToCollection(
      'generatedSessions',
      () => dispatch({ type: FETCH_SESSIONS }),
      (payload: Session[]) => dispatch({ type: FETCH_SESSIONS_SUCCESS, payload }),
      (payload: Error) => dispatch({ type: FETCH_SESSIONS_FAILURE, payload }),
      orderBy('id')
    );
  }
};
