import { Session } from './session';

interface TimeData {
  extend?: number;
  items: string[];
}

interface TimeWithSessions {
  extend?: number;
  items: Session[];
}

export type Time = TimeData | TimeWithSessions;
