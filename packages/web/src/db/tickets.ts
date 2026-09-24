import { orderBy } from 'firebase/firestore';
import { Ticket } from '../models/ticket';
import { subscribeToCollection, Subscription } from '../utils/firestore';

export const subscribeToTickets = (
  onStart: () => void,
  onNext: (payload: Ticket[]) => void,
  onError: (error: Error) => void,
): Subscription => {
  return subscribeToCollection<Ticket>('tickets', onStart, onNext, onError, orderBy('order'));
};
