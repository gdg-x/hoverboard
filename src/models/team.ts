import { Member } from './member';
import { Id } from './types';

export interface TeamData {
  title: string;
}

export type TeamWithoutMembers = Id & TeamData;

export type Team = TeamWithoutMembers & {
  members: Member[];
};
