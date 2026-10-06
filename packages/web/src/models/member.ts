import type { Social } from './social';
import type { ParentId } from './types';

export interface MemberData {
  name: string;
  order: number;
  photo: string;
  photoUrl: string;
  socials: Social[];
  title: string;
}

export type Member = ParentId & MemberData;
