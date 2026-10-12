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
  /** The last day of sales, YYYY-MM-DD in the event's time zone. */
  salesClose?: string;
  /** The first day of sales, YYYY-MM-DD in the event's time zone. */
  salesOpen?: string;
  soldOut: boolean;
  starts?: string;
  url: string;
}
