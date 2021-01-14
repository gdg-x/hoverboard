import { Initialized, RemoteData } from '@abraham/remotedata';

export type PotentialPartnersState = RemoteData<Error, null>;
export const initialPotentialPartnersState: PotentialPartnersState = new Initialized();
