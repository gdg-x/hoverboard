import { DELETE } from '../lib/fixes.js';
import { type Conversion, type OldScheduleDay, convertSchedule } from './convert-schedule.js';
import type { FirestoreDocument, Migration, MigrationPlan } from './types.js';

const plural = (amount: number, noun: string) => `${amount} ${noun}${amount === 1 ? '' : 's'}`;

const formatTime = (time: Conversion['times'][string]) =>
  `${time.day} ${time.startTime}–${time.endTime}, ${time.track ?? 'every track'}`;

const inCollection = (documents: FirestoreDocument[], collection: string) =>
  documents.filter(
    ({ path, data }) => data && path.split('/').length === 2 && path.startsWith(`${collection}/`),
  );

const id = ({ path }: FirestoreDocument) => path.split('/')[1]!;

/**
 * Before v4, a session's time and track came from where its ID was in the `schedule` collection.
 * This writes them onto the sessions, and the tracks to site.json. It leaves `schedule` in place.
 */
export const scheduleOnSessions: Migration = {
  id: '4.0.0-schedule-on-sessions',
  description:
    'Move session times and tracks from the old `schedule` collection onto the sessions.',
  reads: ['schedule'],

  pending: (documents) => {
    const days = inCollection(documents, 'schedule');
    const sessions = inCollection(documents, 'sessions');
    if (!days.length || sessions.some(({ data }) => data?.['day'])) return undefined;
    return `${plural(days.length, 'day')} in \`schedule\`, and ${plural(sessions.length, 'session')} without a day.`;
  },

  plan: (documents) => {
    const sessions = new Map(
      inCollection(documents, 'sessions').map((doc) => [id(doc), doc.raw ?? doc.data!]),
    );
    const schedule = Object.fromEntries(
      inCollection(documents, 'schedule').map((doc) => [id(doc), doc.data as OldScheduleDay]),
    );
    const conversion = convertSchedule(schedule, sessions.keys());
    // `extend` was the old schedule's field for the timeslots a session spans.
    const withoutExtend = (data: Record<string, unknown>) =>
      Object.fromEntries(Object.entries(data).filter(([key]) => key !== 'extend'));
    const removeExtend = (sessionId: string) =>
      'extend' in (sessions.get(sessionId) ?? {}) ? { extend: DELETE } : {};

    const plan: MigrationPlan = {
      updates: [...sessions.keys()].flatMap((sessionId) => {
        const fields = { ...conversion.times[sessionId], ...removeExtend(sessionId) };
        return Object.keys(fields).length ? [{ path: `sessions/${sessionId}`, fields }] : [];
      }),
      creates: Object.entries(conversion.copies).map(([copyId, { from, ...time }]) => ({
        path: `sessions/${copyId}`,
        data: { ...withoutExtend(sessions.get(from)!), ...time },
      })),
      site: (site) => ({
        ...site,
        schedule: { ...(site['schedule'] as object), tracks: conversion.tracks },
      }),
      lines: [
        ...Object.entries(conversion.times).map(
          ([sessionId, time]) => `sessions/${sessionId}: ${formatTime(time)}`,
        ),
        ...Object.entries(conversion.copies).map(
          ([copyId, copy]) => `sessions/${copyId}, a copy of ${copy.from}: ${formatTime(copy)}`,
        ),
        `packages/config/site.json schedule.tracks: ${conversion.tracks.map(({ id: trackId }) => trackId).join(', ')}`,
      ],
      warnings: conversion.warnings,
    };
    return plan;
  },
};
