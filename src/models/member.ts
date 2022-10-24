import { Social } from './social';
import { ParentId } from './types';

export interface MemberData {
  name: string;
  order: number;
  photo: string;
  photoUrl: string;
  socials: Social[];
  title: string;
}

export type Member = ParentId & MemberData;
