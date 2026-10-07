import type { Id } from './types';

export interface SessionData {
  complexity?: string;
  day?: string;
  description: string;
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
  videoId?: string;
}

export type Session = Id & SessionData;
