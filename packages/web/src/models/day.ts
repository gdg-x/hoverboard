import type { Timeslot } from './timeslot';
import type { Track } from './track';

export interface Day {
  date: string;
  dateReadable?: string;
  timeslots: Timeslot[];
  tracks: Track[];
}
