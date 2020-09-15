import { Social } from './social';

export interface Member {
  name: string;
  order: number;
  photo: string;
  photoUrl: string;
  socials: Social[];
  title: string;
}
