import { collection, getDocs, orderBy, query } from 'firebase/firestore';
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

const getTickets = async (): Promise<Ticket[]> => {
  const { docs } = await getDocs(query(collection(db, 'tickets'), orderBy('order', 'asc')));

  return docs.map<Ticket>(mergeDataAndId);
};

export const fetchTickets = () => async (dispatch: Dispatch<FetchTicketsActions>) => {
  dispatch({
    type: FETCH_TICKETS,
  });

  try {
    dispatch({
      type: FETCH_TICKETS_SUCCESS,
      payload: await getTickets(),
    });
  } catch (error) {
    dispatch({
      type: FETCH_TICKETS_FAILURE,
      payload: error,
    });
  }
};
