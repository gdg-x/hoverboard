import { Initialized, RemoteData } from '@abraham/remotedata';
import { Team } from '../../models/team';

export type TeamState = RemoteData<Error, Team[]>;
export const initialTeamState: TeamState = new Initialized();
