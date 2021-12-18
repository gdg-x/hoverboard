import { Initialized, RemoteData } from '@abraham/remotedata';
import { Team } from '../../models/team';

export type TeamsState = RemoteData<Error, Team[]>;
export const initialTeamsState: TeamsState = new Initialized();
