import { PreviousSession } from './previous-session';
import { Social } from './social';

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
