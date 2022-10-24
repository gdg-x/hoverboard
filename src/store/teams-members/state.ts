import { Initialized, RemoteData } from '@abraham/remotedata';
import { Team } from '../../models/team';

export type TeamsMembersState = RemoteData<Error, Team[]>;
export const initialTeamsMembersState: TeamsMembersState = new Initialized();
