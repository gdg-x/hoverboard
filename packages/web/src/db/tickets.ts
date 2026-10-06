import { orderBy } from 'firebase/firestore';
import type { Ticket } from '../models/ticket';
import { subscribeToCollection, type Subscription } from '../utils/firestore';

export const subscribeToTickets = (
  onStart: () => void,
  onNext: (payload: Ticket[]) => void,
  onError: (error: Error) => void,
): Subscription => {
  return subscribeToCollection<Ticket>('tickets', onStart, onNext, onError, orderBy('order'));
};
