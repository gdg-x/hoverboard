import { Initialized, RemoteData } from '@abraham/remotedata';
import { Member } from '../../models/member';

export type MembersState = RemoteData<Error, Member[]>;
export const initialMembersState: MembersState = new Initialized();
