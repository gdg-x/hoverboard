import type { Session } from '../models/session';
import type { Speaker, SpeakerWithTags } from '../models/speaker';

/** A track of `schedule.tracks` in site.json. */
export interface Track {
  id: string;
  title: string;
  /** Without it, the track is on every day. */
  days?: string[];
}

export interface ScheduleTrack {
  id: string;
  title: string;
}

export type BuiltSession = Omit<Session, 'speakers' | 'track'> & {
  mainTag: string;
  speakers: Speaker[];
  /** Only for a session on the schedule in one track. */
  track?: ScheduleTrack;
  duration?: { hh: number; mm: number };
};

export interface SessionBlock {
  /** `row-start / column-start / row-end / column-end`, without the time column. */
  gridArea: string;
  items: BuiltSession[];
}

export interface BuiltTimeslot {
  startTime: string;
  endTime: string;
  /** The sessions that start in this row. */
  sessions: SessionBlock[];
}

export interface BuiltDay {
  date: string;
  tracks: ScheduleTrack[];
  timeslots: BuiltTimeslot[];
  tags: string[];
}

export type BuiltSpeaker = SpeakerWithTags & { sessions: BuiltSession[] };

export interface BuiltSchedule {
  schedule: BuiltDay[];
  sessions: BuiltSession[];
  speakers: BuiltSpeaker[];
}

interface Placed {
  session: BuiltSession;
  startTime: string;
  endTime: string;
  /** Without it, the session spans every track. */
  column: number | undefined;
}

const toMinutes = (time: string) => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Not `localeCompare`, so the server and the browser sort the same.
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

const combineTags = (tags: (string[] | undefined)[]) => [...new Set(tags.flatMap((t) => t ?? []))];

const tracksOn = (tracks: Track[], date: string) =>
  tracks.filter(({ days }) => !days || days.includes(date));

const buildSession = (
  { day, startTime, endTime, track, speakers = [], ...session }: Session,
  speakersById: Map<string, Speaker>,
  tracksById: Map<string, Track>,
  published: boolean,
): BuiltSession => {
  const built: BuiltSession = {
    ...session,
    mainTag: session.tags?.[0] || 'General',
    speakers: speakers.flatMap((id) => speakersById.get(id) ?? []),
  };
  if (!published || !day || !startTime || !endTime) return built;
  const minutes = Math.max(0, toMinutes(endTime) - toMinutes(startTime));
  const known = track === undefined ? undefined : tracksById.get(track);
  return {
    ...built,
    day,
    startTime,
    endTime,
    duration: { hh: Math.floor(minutes / 60), mm: minutes % 60 },
    ...(known ? { track: { id: known.id, title: known.title } } : {}),
  };
};

const buildDay = (date: string, placed: Placed[], tracks: Track[]): BuiltDay => {
  const dayTracks = tracksOn(tracks, date);
  const columns = Math.max(dayTracks.length, 1);
  const times = [...new Set(placed.flatMap(({ startTime, endTime }) => [startTime, endTime]))].sort(
    (a, b) => toMinutes(a) - toMinutes(b),
  );
  const row = (time: string) => times.indexOf(time) + 1;
  const timeslots: BuiltTimeslot[] = times
    .slice(0, -1)
    .map((startTime, index) => ({ startTime, endTime: times[index + 1]!, sessions: [] }));

  for (const { session, startTime, endTime, column } of placed) {
    const [columnStart, columnEnd] =
      column === undefined ? [1, columns + 1] : [column + 1, column + 2];
    const rowStart = row(startTime);
    timeslots[rowStart - 1]!.sessions.push({
      gridArea: `${rowStart} / ${columnStart} / ${row(endTime)} / ${columnEnd}`,
      items: [session],
    });
  }

  return {
    date,
    tracks: dayTracks.map(({ id, title }) => ({ id, title })),
    timeslots,
    tags: combineTags(placed.map(({ session }) => session.tags)),
  };
};

/**
 * The sessions the schedule can't show as they are: a track that isn't in site.json or not on the
 * session's day, an end that isn't after the start, or two sessions at once in one track.
 */
export const scheduleErrors = (sessions: Session[], tracks: Track[]): string[] => {
  const errors: string[] = [];
  const placed: { id: string; day: string; start: number; end: number; track?: string }[] = [];
  for (const { id, day, startTime, endTime, track } of [...sessions].sort((a, b) =>
    compare(a.id, b.id),
  )) {
    if (!day || !startTime || !endTime) continue;
    const [start, end] = [toMinutes(startTime), toMinutes(endTime)];
    if (end <= start) {
      errors.push(`sessions/${id}: endTime ${endTime} is not after startTime ${startTime}`);
      continue;
    }
    if (track !== undefined) {
      const known = tracks.find((item) => item.id === track);
      if (!known) {
        errors.push(`sessions/${id}: track "${track}" is not in schedule.tracks in site.json`);
        continue;
      }
      if (known.days && !known.days.includes(day)) {
        errors.push(`sessions/${id}: track "${track}" is not on ${day}`);
        continue;
      }
    }
    for (const other of placed) {
      const sameTrack = other.track === undefined || track === undefined || other.track === track;
      if (other.day === day && sameTrack && other.start < end && start < other.end) {
        errors.push(
          `sessions/${other.id} and sessions/${id} overlap on ${day} in ${track ?? other.track ?? 'every track'}`,
        );
      }
    }
    placed.push({ id, day, start, end, ...(track === undefined ? {} : { track }) });
  }
  return errors;
};

/**
 * Builds the schedule, sessions and speakers from the raw `sessions` and `speakers`. A session is on
 * the schedule when the schedule is published, it has a day and times, and its track is on that day.
 */
export const buildSchedule = (
  raw: { sessions: Session[]; speakers: Speaker[] },
  options: { published: boolean; tracks: Track[] },
): BuiltSchedule => {
  const speakersById = new Map(raw.speakers.map((speaker) => [speaker.id, speaker]));
  const tracksById = new Map(options.tracks.map((track) => [track.id, track]));
  const sessions = [...raw.sessions]
    .sort((a, b) => compare(a.id, b.id))
    .map((session) => ({
      raw: session,
      built: buildSession(session, speakersById, tracksById, options.published),
    }));

  const byDay = new Map<string, Placed[]>();
  for (const { raw: session, built } of sessions) {
    const { day, startTime, endTime } = built;
    if (!day || !startTime || !endTime || toMinutes(endTime) <= toMinutes(startTime)) continue;
    const column =
      session.track === undefined
        ? undefined
        : tracksOn(options.tracks, day).findIndex(({ id }) => id === session.track);
    if (column === -1) continue;
    byDay.set(day, [...(byDay.get(day) ?? []), { session: built, startTime, endTime, column }]);
  }

  const schedule = [...byDay.keys()].sort(compare).map((date) => {
    const placed = byDay
      .get(date)!
      .sort(
        (a, b) =>
          toMinutes(a.startTime) - toMinutes(b.startTime) || (a.column ?? -1) - (b.column ?? -1),
      );
    return buildDay(date, placed, options.tracks);
  });

  // A speaker's sessions are in schedule order, then the ones not on it.
  const scheduled = schedule.flatMap(({ timeslots }) =>
    timeslots.flatMap((timeslot) => timeslot.sessions.flatMap(({ items }) => items)),
  );
  const onSchedule = new Set(scheduled.map(({ id }) => id));
  const ordered = [
    ...scheduled,
    ...sessions.map(({ built }) => built).filter(({ id }) => !onSchedule.has(id)),
  ];
  const sessionsBySpeaker = new Map<string, BuiltSession[]>();
  for (const session of ordered) {
    for (const { id } of session.speakers) {
      sessionsBySpeaker.set(id, [...(sessionsBySpeaker.get(id) ?? []), session]);
    }
  }

  const speakers = [...raw.speakers]
    .sort((a, b) => compare(a.name, b.name) || compare(a.id, b.id))
    .map((speaker) => {
      const speakerSessions = sessionsBySpeaker.get(speaker.id) ?? [];
      return {
        ...speaker,
        sessions: speakerSessions,
        tags: combineTags(speakerSessions.map(({ tags }) => tags)),
      };
    });

  return { schedule, sessions: sessions.map(({ built }) => built), speakers };
};
