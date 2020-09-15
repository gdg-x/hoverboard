import { Badge } from './badge';
import { Social } from './social';

export interface Speaker {
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
