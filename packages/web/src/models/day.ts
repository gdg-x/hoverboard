import { Timeslot } from './timeslot';
import { Track } from './track';

export interface Day {
  date: string;
  dateReadable: string;
  timeslots: Timeslot[];
  tracks: Track[];
}
