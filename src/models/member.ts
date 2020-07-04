type Social = import('./social').Social;

export interface Member {
  name: string;
  order: number;
  photo: string;
  photoUrl: string;
  socials: Social[];
  title: string;
}
