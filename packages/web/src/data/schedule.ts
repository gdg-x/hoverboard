import { scheduleOptions } from '../config/site';
import { buildSchedule } from '../schedule/build-schedule';
import type { Content } from '../store/content';

/** The schedule, sessions and speakers that the store's selectors build from this content. */
export const buildContentSchedule = ({ sessions = [], speakers = [] }: Partial<Content>) =>
  buildSchedule({ sessions, speakers }, scheduleOptions);

/** A session and its speakers, the raw documents its page shows. */
export const sessionContent = (
  { sessions = [], speakers = [] }: Partial<Content>,
  id: string,
): Pick<Content, 'sessions' | 'speakers'> => {
  const own = sessions.filter((session) => session.id === id);
  const ids = new Set(own.flatMap((session) => session.speakers ?? []));
  return { sessions: own, speakers: speakers.filter((speaker) => ids.has(speaker.id)) };
};

/** A speaker, their sessions and those sessions' speakers, the raw documents their page shows. */
export const speakerContent = (
  { sessions = [], speakers = [] }: Partial<Content>,
  id: string,
): Pick<Content, 'sessions' | 'speakers'> => {
  const own = sessions.filter((session) => session.speakers?.includes(id));
  const ids = new Set([id, ...own.flatMap((session) => session.speakers ?? [])]);
  return { sessions: own, speakers: speakers.filter((speaker) => ids.has(speaker.id)) };
};
