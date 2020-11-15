import { Id } from './types';

export interface PartnerData {
  logoUrl: string;
  name: string;
  order: number;
  url: string;
}

export type Partner = Id & PartnerData;
