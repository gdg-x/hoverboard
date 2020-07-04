type Badge = import('./badge').Badge;
type Social = import('./social').Social;

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
