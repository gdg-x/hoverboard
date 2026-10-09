import type { Id } from './types';

export interface SessionData {
  complexity?: string;
  day?: string;
  description: string;
  endTime?: string;
  extend?: number;
  externalId?: string;
  icon?: string;
  image?: string;
  language?: string;
  presentation?: string;
  speakers?: string[];
  source?: string;
  startTime?: string;
  tags?: string[];
  title: string;
  /** A track ID from `schedule.tracks` in site.json. Without it, the session spans every track. */
  track?: string;
  videoId?: string;
}

export type Session = Id & SessionData;
