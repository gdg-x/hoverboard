export interface Ticket {
  available: boolean;
  currency: string;
  ends?: string;
  inDemand?: boolean;
  info: string;
  name: string;
  price: number;
  primary?: boolean;
  regular?: boolean;
  soldOut: boolean;
  starts?: string;
  url: string;
}
