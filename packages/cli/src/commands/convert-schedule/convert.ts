/** A day of the old `schedule` collection, where a session's time and track come from its place. */
export interface OldScheduleDay {
  date?: string;
  tracks?: { title: string }[];
  timeslots?: {
    startTime?: string;
    endTime?: string;
    sessions?: { items?: string[]; extend?: number }[];
  }[];
}

export interface Track {
  id: string;
  title: string;
  /** Only when the track is not on every day. */
  days?: string[];
}

export interface SessionTime {
  day: string;
  startTime: string;
  endTime: string;
  /** Without a track, the session spans every track. */
  track?: string;
}

export interface Conversion {
  tracks: Track[];
  /** The new fields of sessions that keep their ID. */
  times: Record<string, SessionTime>;
  /** A session the old schedule shows more than once gets a copy, with a new ID, for each extra time. */
  copies: Record<string, SessionTime & { from: string }>;
  warnings: string[];
}

export const trackId = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const toMinutes = (time: string) => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

const collectTracks = (days: [string, OldScheduleDay][]): Track[] => {
  const tracks = new Map<string, Track & { days: string[] }>();
  for (const [date, day] of days) {
    for (const { title } of day.tracks ?? []) {
      const id = trackId(title);
      const track = tracks.get(id) ?? { id, title, days: [] };
      if (!track.days.includes(date)) track.days.push(date);
      tracks.set(id, track);
    }
  }
  return [...tracks.values()].map(({ days: trackDays, ...track }) =>
    trackDays.length < days.length ? { ...track, days: trackDays } : track,
  );
};

/**
 * Moves each session's day, times and track from its place in the old schedule onto the session.
 * Split timeslots share their time evenly, in whole minutes, as the schedule generator did.
 */
export const convertSchedule = (
  schedule: Record<string, OldScheduleDay>,
  sessionIds: Iterable<string>,
): Conversion => {
  const known = new Set(sessionIds);
  const days = Object.entries(schedule)
    .map(([id, day]): [string, OldScheduleDay] => [day.date ?? id, day])
    .sort(([a], [b]) => a.localeCompare(b));
  const result: Conversion = { tracks: collectTracks(days), times: {}, copies: {}, warnings: [] };
  const copyCounts = new Map<string, number>();

  const place = (id: string, time: SessionTime): SessionTime | undefined => {
    if (!known.has(id)) {
      result.warnings.push(`The schedule on ${time.day} lists session ${id}, which doesn't exist.`);
      return undefined;
    }
    if (!result.times[id]) {
      result.times[id] = time;
      return time;
    }
    let count = copyCounts.get(id) ?? 1;
    let copyId: string;
    do {
      count += 1;
      copyId = `${id}-${count}`;
    } while (known.has(copyId) || result.copies[copyId]);
    copyCounts.set(id, count);
    const copy = { ...time, from: id };
    result.copies[copyId] = copy;
    result.warnings.push(
      `Session ${id} is on the schedule more than once, so ${copyId} is a copy of it on ${time.day} at ${time.startTime}.`,
    );
    return copy;
  };

  for (const [date, day] of days) {
    const trackIds = (day.tracks ?? []).map(({ title }) => trackId(title));
    const timeslots = day.timeslots ?? [];
    // Sessions that span more timeslots, until the timeslot index before `until`.
    let extended: { until: number; times: SessionTime[] }[] = [];

    timeslots.forEach((timeslot, index) => {
      const blocks = timeslot.sessions ?? [];
      if (!timeslot.startTime || !timeslot.endTime) {
        if (blocks.length) {
          result.warnings.push(
            `A timeslot on ${date} has no start or end time, so it was skipped.`,
          );
        }
        return;
      }
      extended = extended.filter(({ until }) => until > index);
      const spansAll = blocks.length === 1;
      // A session across every track can't share the time with a longer session in one track.
      if (spansAll && extended.length) {
        for (const { times } of extended) {
          for (const time of times) {
            time.endTime = timeslot.startTime;
            result.warnings.push(
              `A session on ${date} in ${time.track ?? 'every track'} now ends at ${timeslot.startTime}, when a session across every track starts.`,
            );
          }
        }
        extended = [];
      }

      blocks.forEach((block, blockIndex) => {
        const items = block.items ?? [];
        const extend = block.extend ?? 1;
        const end = toMinutes(timeslots[index + extend - 1]?.endTime ?? timeslot.endTime!);
        const start = toMinutes(timeslot.startTime!);
        const track = spansAll ? undefined : trackIds[blockIndex];
        const placed: SessionTime[] = [];
        items.forEach((id, itemIndex) => {
          const itemStart =
            itemIndex === 0
              ? start
              : start + Math.floor(((end - start) * itemIndex) / items.length);
          const itemEnd =
            itemIndex === items.length - 1
              ? end
              : start + Math.floor(((end - start) * (itemIndex + 1)) / items.length);
          const time = place(id, {
            day: date,
            startTime: toTime(itemStart),
            endTime: toTime(itemEnd),
            ...(track ? { track } : {}),
          });
          if (time) placed.push(time);
        });
        if (extend > 1 && placed.length) extended.push({ until: index + extend, times: placed });
      });
    });
  }
  return result;
};
