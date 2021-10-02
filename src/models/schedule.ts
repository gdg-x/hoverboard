import { Day } from './day';

export interface Schedule {
  [date: string]: Day;
}
