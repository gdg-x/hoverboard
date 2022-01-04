import { Initialized, RemoteData } from '@abraham/remotedata';
import { TeamWithoutMembers } from '../../models/team';

export type TeamsState = RemoteData<Error, TeamWithoutMembers[]>;
export const initialTeamsState: TeamsState = new Initialized();
