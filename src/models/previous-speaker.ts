type Social = import('./social').Social;
type PreviousSession = import('./previous-session').PreviousSession;

export interface PreviousSpeaker {
  bio: string;
  company: string;
  companyLogo?: string;
  country: string;
  id: string;
  name: string;
  order: number;
  photoUrl: string;
  sessions?: { [key: string]: PreviousSession[] };
  socials: Social[];
  title: string;
}
