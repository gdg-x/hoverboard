import { Initialized, RemoteData } from '@abraham/remotedata';
import { PartnerGroup } from '../../models/partner-group';

export type PartnersState = RemoteData<Error, PartnerGroup[]>;
export const initialPartnersState: PartnersState = new Initialized();
