import { Partner, PartnerData } from './partner';
import { Id } from './types';

export interface PartnerGroupData {
  items: PartnerData[];
  order: number;
  title: string;
}

export type PartnerGroup = Id &
  PartnerGroupData & {
    items: Partner[];
  };
