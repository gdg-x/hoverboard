import { Initialized, Success } from '@abraham/remotedata';
import { orderBy } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { Ticket } from '../../models/ticket';
import { subscribeToCollection, Subscription } from '../../utils/firestore';
import {
  FetchTicketsActions,
  FETCH_TICKETS,
  FETCH_TICKETS_FAILURE,
  FETCH_TICKETS_SUCCESS,
} from './types';

let subscription: Subscription = new Initialized();

export const unsubscribe = () => {
  if (subscription instanceof Success) {
    subscription.data();
  }
};

export const fetchTickets = async (dispatch: Dispatch<FetchTicketsActions>) => {
  if (subscription instanceof Initialized) {
    subscription = subscribeToCollection(
      'tickets',
      () => dispatch({ type: FETCH_TICKETS }),
      (payload: Ticket[]) => dispatch({ type: FETCH_TICKETS_SUCCESS, payload }),
      (payload: Error) => dispatch({ type: FETCH_TICKETS_FAILURE, payload }),
      orderBy('order')
    );
  }
};
