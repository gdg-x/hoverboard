import { Initialized, RemoteData } from '@abraham/remotedata';

export type PotentialPartnersState = RemoteData<Error, true>;
export const initialPotentialPartnersState: PotentialPartnersState = new Initialized();
