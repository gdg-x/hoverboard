import type { Day } from './day';

export interface Schedule {
  [date: string]: Day;
}
