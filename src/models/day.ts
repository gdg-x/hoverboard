import { Timeslot } from './timeslot';
import { Track } from './track';

export interface Day {
  dateReadable: string;
  timeslots: Timeslot[];
  tracks: Track[];
}
