type Timeslot = import('./timeslot').Timeslot;
type Track = import('./track').Track;

export interface Day {
  dateReadable: string;
  timeslots: Timeslot[];
  tracks: Track[];
}
