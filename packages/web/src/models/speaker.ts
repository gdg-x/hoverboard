import type { Badge } from './badge';
import type { Social } from './social';
import type { Id } from './types';

export interface SpeakerData {
  badges?: Badge[];
  bio: string;
  company: string;
  companyLogo: string;
  companyLogoUrl: string;
  country: string;
  externalId?: string;
  featured: boolean;
  name: string;
  /** Only the home page's speakers block uses it. */
  order?: number;
  photo: string;
  photoUrl: string;
  pronouns?: string;
  shortBio: string;
  socials: Social[];
  source?: string;
  title: string;
}

export type Speaker = Id & SpeakerData;

export type SpeakerWithTags = Speaker & {
  tags: string[];
};
