import { Id } from './types';

export interface SessionData {
  complexity?: string;
  description: string;
  extend?: number;
  icon?: string;
  image?: string;
  language?: string;
  presentation?: string;
  speakers?: string[];
  tags?: string[];
  title: string;
  videoId?: string;
}

export type Session = Id & SessionData;
