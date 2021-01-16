import { Initialized, RemoteData } from '@abraham/remotedata';
import { Ticket } from '../../models/ticket';

export type TicketsState = RemoteData<Error, Ticket[]>;
export const initialTicketsState: TicketsState = new Initialized();
