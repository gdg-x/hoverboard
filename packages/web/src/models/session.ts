import { Id } from './types';

export interface SessionData {
  complexity?: string;
  day?: string;
  description: string;
  extend?: number;
  icon?: string;
  image?: string;
  language?: string;
  presentation?: string;
  speakers?: string[];
  startTime?: string;
  tags?: string[];
  title: string;
  videoId?: string;
}

export type Session = Id & SessionData;
