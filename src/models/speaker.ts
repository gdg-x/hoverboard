import { Badge } from './badge';
import { Social } from './social';
import { Id } from './types';

export interface SpeakerData {
  badges?: Badge[];
  bio: string;
  company: string;
  companyLogo: string;
  companyLogoUrl: string;
  country: string;
  featured: boolean;
  name: string;
  order: number;
  photo: string;
  photoUrl: string;
  pronouns?: string;
  shortBio: string;
  socials: Social[];
  title: string;
}

export type Speaker = Id & SpeakerData;

export type SpeakerWithTags = Speaker & {
  tags: string[];
};
