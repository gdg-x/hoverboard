import type { PreviousSession } from './previous-session';
import type { Social } from './social';

export interface PreviousSpeaker {
  bio: string;
  company: string;
  companyLogo?: string;
  country: string;
  id: string;
  name: string;
  order: number;
  photoUrl: string;
  sessions: { [key: string]: PreviousSession[] };
  socials: Social[];
  title: string;
}
