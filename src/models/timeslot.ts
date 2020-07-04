type Time = import('./time').Time;

export interface Timeslot {
  endTime: string;
  sessions: Time[];
  startTime: string;
}
