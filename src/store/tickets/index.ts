import { RootState } from '..';
import { CollectionState, createCollectionSlice } from '../create-collection-slice';
import { Ticket } from '../../models/ticket';
import { subscribeToTickets } from '../../db/tickets';

export type TicketsState = CollectionState<Ticket>;

const { reducer, selectOrFetch } = createCollectionSlice<Ticket>('tickets', subscribeToTickets);

export const selectTickets = (state: RootState): TicketsState => selectOrFetch(state.tickets);

export default reducer;
