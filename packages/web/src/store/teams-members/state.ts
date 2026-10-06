import { Initialized, type RemoteData } from '@abraham/remotedata';
import type { Team } from '../../models/team';

export type TeamsMembersState = RemoteData<Error, Team[]>;
export const initialTeamsMembersState: TeamsMembersState = new Initialized();
