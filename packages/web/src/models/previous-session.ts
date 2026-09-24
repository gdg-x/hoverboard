export interface PreviousSessionWithYear {
  presentation?: string;
  tags: string[];
  title: string;
  videoId?: string;
  year: string;
}

export type PreviousSession = Omit<PreviousSessionWithYear, 'year'>;
