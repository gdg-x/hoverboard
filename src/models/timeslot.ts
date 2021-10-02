import { Time } from './time';

export interface Timeslot {
  endTime: string;
  sessions: Time[];
  startTime: string;
}
