import { Dispatch } from 'redux';
import { Ticket } from '../../models/ticket';
import { mergeId } from '../../utils/merge-id';
import { db } from '../db';
import {
  FetchTicketsActions,
  FETCH_TICKETS,
  FETCH_TICKETS_FAILURE,
  FETCH_TICKETS_SUCCESS,
} from './types';

const getTickets = async (): Promise<Ticket[]> => {
  const { docs } = await db().collection('tickets').orderBy('order', 'asc').get();

  return docs.map<Ticket>(mergeId);
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
