import { Failure, Initialized, Pending, RemoteData, Success } from '@abraham/remotedata';
import { collection, onSnapshot, orderBy, query, Unsubscribe } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { db } from '../../firebase';
import { Ticket } from '../../models/ticket';
import { mergeDataAndId } from '../../utils/firestore';
import {
  FetchTicketsActions,
  FETCH_TICKETS,
  FETCH_TICKETS_FAILURE,
  FETCH_TICKETS_SUCCESS,
} from './types';

type Subscription = RemoteData<Error, Unsubscribe>;
let subscription: Subscription = new Initialized();

export const unsubscribe = () => {
  if (subscription instanceof Success) {
    subscription.data();
  }
};

const subscribe = (path: string, dispatch: Dispatch<FetchTicketsActions>) => {
  const unsubscribe = onSnapshot(
    query(collection(db, path), orderBy('order', 'asc')),
    (snapshot) => {
      dispatch({
        type: FETCH_TICKETS_SUCCESS,
        payload: snapshot.docs.map<Ticket>(mergeDataAndId),
      });
    },
    (error) => {
      subscription = new Failure(error);
      dispatch({
        type: FETCH_TICKETS_FAILURE,
        payload: error,
      });
    }
  );

  return new Success(unsubscribe);
};

export const fetchTickets = async (dispatch: Dispatch<FetchTicketsActions>) => {
  if (subscription instanceof Initialized) {
    subscription = new Pending();
    dispatch({ type: FETCH_TICKETS });

    subscription = subscribe('tickets', dispatch);
  }
};
