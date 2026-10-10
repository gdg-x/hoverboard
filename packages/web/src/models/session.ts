import type { Id } from './types';

export interface SessionData {
  complexity?: string;
  day?: string;
  description: string;
  endTime?: string;
  externalId?: string;
  icon?: string;
  image?: string;
  language?: string;
  presentation?: string;
  speakers?: string[];
  source?: string;
  /** The sponsor's name, for a session given to a sponsor. The schedule labels it as sponsored. */
  sponsor?: string;
  startTime?: string;
  /** The link to watch the session live. It wins over its track's and the event's. */
  stream?: string;
  tags?: string[];
  title: string;
  /** A track ID from `schedule.tracks` in site.json. Without it, the session spans every track. */
  track?: string;
  videoId?: string;
}

export type Session = Id & SessionData;
