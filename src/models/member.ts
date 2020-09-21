import { Social } from './social';
import { Id } from './types';

export interface MemberData {
  name: string;
  order: number;
  photo: string;
  photoUrl: string;
  socials: Social[];
  title: string;
}

export type Member = Id & MemberData;
