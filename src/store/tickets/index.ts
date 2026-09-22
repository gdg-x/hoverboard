import { orderBy } from 'firebase/firestore';
import { RootState } from '..';
import { CollectionState, createCollectionSlice } from '../create-collection-slice';
import { Ticket } from '../../models/ticket';
import { subscribeToCollection } from '../../utils/firestore';

export type TicketsState = CollectionState<Ticket>;

const { reducer, selectOrFetch } = createCollectionSlice<Ticket>(
  'tickets',
  (onStart, onNext, onError) =>
    subscribeToCollection('tickets', onStart, onNext, onError, orderBy('order')),
);

export const selectTickets = (state: RootState): TicketsState => selectOrFetch(state.tickets);

export default reducer;
