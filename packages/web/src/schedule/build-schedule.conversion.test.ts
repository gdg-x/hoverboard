import { describe, expect, it } from 'vitest';
import data from '../../../../docs/default-firebase-data.json';
import site from '../../../config/site.json';
import type { Session } from '../models/session';
import type { Speaker } from '../models/speaker';
import { type BuiltSession, buildSchedule } from './build-schedule';

// Checks the new model against the old generator, until the generator is removed.
// The generator is in the functions' TypeScript project, so TypeScript must not follow its import.
const generator = '../../../server/functions/src/schedule-generator/speakers-sessions-schedule-map';
const { sessionsSpeakersScheduleMap } = (await import(/* @vite-ignore */ generator)) as {
  sessionsSpeakersScheduleMap: (
    sessions: Record<string, unknown>,
    speakers: Record<string, unknown>,
    schedule: Record<string, unknown>,
  ) => unknown;
};

interface OldSession {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  mainTag: string;
  duration: { hh: number; mm: number };
  speakers: { id: string }[];
}

interface OldDay {
  tracks: { title: string }[];
  timeslots: { sessions: { items: OldSession[] }[] }[];
}

interface OldSpeaker {
  sessions: { id: string }[];
  tags: string[];
}

const { schedule, sessions, speakers } = data as unknown as {
  schedule: Record<string, unknown>;
  sessions: Record<string, Omit<Session, 'id'>>;
  speakers: Record<string, Omit<Speaker, 'id'>>;
};

// Copies of sessions that the old schedule showed more than once, such as `133-2`.
const original = (id: string) => id.replace(/-\d+$/, '');
const pad = (time: string) =>
  time.replace(/^(\d+):(\d+)$/, (_, h, m) => `${h.padStart(2, '0')}:${m.padStart(2, '0')}`);

const old = sessionsSpeakersScheduleMap(
  Object.fromEntries(Object.entries(sessions).filter(([id]) => id === original(id))),
  speakers,
  schedule,
) as unknown as {
  schedule: Record<string, OldDay>;
  speakers: Record<string, OldSpeaker>;
};

const built = buildSchedule(
  {
    sessions: Object.entries(sessions).map(([id, session]) => ({ ...session, id })),
    speakers: Object.entries(speakers).map(([id, speaker]) => ({ ...speaker, id })),
  },
  { published: true, tracks: site.schedule.tracks },
);

const placement = (
  date: string,
  session: OldSession | BuiltSession,
  track: string | undefined,
) => ({
  id: original(session.id),
  date,
  startTime: pad(session.startTime!),
  endTime: pad(session.endTime!),
  track,
  duration: session.duration,
  mainTag: session.mainTag,
  speakers: session.speakers.map(({ id }) => id),
});

const oldPlacements = Object.entries(old.schedule).flatMap(([date, day]) =>
  day.timeslots.flatMap(({ sessions: blocks }) =>
    blocks.flatMap(({ items }, index) =>
      items.map((session) =>
        // A timeslot with one block spans every track.
        placement(date, session, blocks.length === 1 ? undefined : day.tracks[index]!.title),
      ),
    ),
  ),
);

describe('buildSchedule on the converted demo data', () => {
  it('has the same days and tracks as the old generator', () => {
    expect(
      built.schedule.map(({ date, tracks }) => [date, tracks.map(({ title }) => title)]),
    ).toEqual(
      Object.entries(old.schedule).map(([date, { tracks }]) => [
        date,
        tracks.map(({ title }) => title),
      ]),
    );
  });

  it('places each session at the same time and in the same track as the old generator', () => {
    const placements = built.schedule.flatMap(({ date, tracks, timeslots }) =>
      timeslots.flatMap(({ sessions: blocks }) =>
        blocks.flatMap(({ gridArea, items }) => {
          const [rowStart, columnStart, rowEnd, columnEnd] = gridArea.split(' / ').map(Number);
          const track =
            columnEnd! - columnStart! === tracks.length ? undefined : tracks[columnStart! - 1];
          return items.map((session) => {
            expect(timeslots[rowStart! - 1]!.startTime).toBe(session.startTime);
            expect(timeslots[rowEnd! - 2]!.endTime).toBe(session.endTime);
            expect(session.track).toEqual(track);
            return placement(date, session, track?.title);
          });
        }),
      ),
    );

    // The new model can't show a workshop in one track across lunch in every track, so it ends at lunch.
    const expected = oldPlacements.map((item) =>
      item.date === '2016-09-09' && item.id === '109'
        ? { ...item, endTime: '12:30', duration: { hh: 1, mm: 30 } }
        : item,
    );
    expect(placements).toEqual(expect.arrayContaining(expected));
    expect(placements).toHaveLength(expected.length);
  });

  it('keeps the sessions the old schedule left out, without times', () => {
    const placed = new Set(oldPlacements.map(({ id }) => id));
    const unscheduled = built.sessions.filter(({ id }) => !placed.has(original(id)));

    expect(unscheduled.map(({ id }) => id)).toEqual(['138']);
    expect(unscheduled[0]).not.toHaveProperty('startTime');
  });

  it('gives each speaker the same sessions and tags as the old generator', () => {
    for (const speaker of built.speakers) {
      const oldSpeaker = old.speakers[speaker.id];
      // The old generator only kept speakers without sessions when they changed.
      if (!oldSpeaker) {
        expect(speaker.sessions, speaker.id).toEqual([]);
        continue;
      }
      expect(new Set(speaker.sessions.map(({ id }) => original(id))), speaker.id).toEqual(
        new Set(oldSpeaker.sessions.map(({ id }) => id)),
      );
      expect(new Set(speaker.tags), speaker.id).toEqual(new Set(oldSpeaker.tags));
    }
    expect(built.speakers.filter(({ sessions: own }) => own.length)).toHaveLength(
      Object.keys(old.speakers).length,
    );
  });
});
