import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { type DocumentData, FieldValue } from 'firebase-admin/firestore';
import { validateContent } from '../../lib/content.js';
import { firestore, repoRoot } from '../../lib/firestore.js';
import { runCommand } from '../../lib/spawn.js';
import { SITE_CONFIG_PATH } from '../../utils/firebase-project.js';
import { type Conversion, type OldScheduleDay, convertSchedule } from './convert.js';

// Firestore takes at most 500 writes in a batch.
const BATCH_SIZE = 400;

/** A session without `extend`, the old schedule's field for the timeslots a session spans. */
const withoutExtend = ({ extend: _extend, ...session }: DocumentData): DocumentData => session;

const formatTime = (time: Conversion['times'][string]) =>
  `${time.day} ${time.startTime}–${time.endTime}, ${time.track ?? 'every track'}`;

const writeTracks = (tracks: Conversion['tracks']) => {
  const path = join(repoRoot, SITE_CONFIG_PATH);
  const site = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  site['schedule'] = { ...(site['schedule'] as object), tracks };
  writeFileSync(path, `${JSON.stringify(site, null, 2)}\n`);
  const prettier = join(repoRoot, 'node_modules', '.bin', 'prettier');
  if (existsSync(prettier)) {
    runCommand(prettier, ['--log-level', 'warn', '--write', SITE_CONFIG_PATH], repoRoot);
  }
};

/**
 * Moves session times and tracks from the old `schedule` collection onto the sessions, and the
 * tracks to site.json. It leaves `schedule` in place, so the result can be checked first.
 */
export const runConvertSchedule = async ({ dryRun = false } = {}): Promise<Conversion> => {
  const [scheduleSnapshot, sessionsSnapshot] = await Promise.all([
    firestore.collection('schedule').get(),
    firestore.collection('sessions').get(),
  ]);
  const schedule = Object.fromEntries(
    scheduleSnapshot.docs.map((doc) => [doc.id, doc.data() as OldScheduleDay]),
  );
  const sessions = new Map<string, DocumentData>(
    sessionsSnapshot.docs.map((doc) => [doc.id, doc.data()]),
  );
  const conversion = convertSchedule(schedule, sessions.keys());
  const removeExtend = (id: string) =>
    sessions.get(id) && 'extend' in sessions.get(id)! ? { extend: FieldValue.delete() } : {};

  const writes: [id: string, data: DocumentData, merge: boolean][] = [
    ...Object.entries(conversion.times).map(([id, time]): [string, DocumentData, boolean] => [
      id,
      { ...time, ...removeExtend(id) },
      true,
    ]),
    ...Object.entries(conversion.copies).map(
      ([id, { from, ...time }]): [string, DocumentData, boolean] => [
        id,
        { ...withoutExtend(sessions.get(from)!), ...time },
        false,
      ],
    ),
    // Sessions that aren't on the old schedule lose `extend` too.
    ...[...sessions.keys()]
      .filter((id) => !conversion.times[id] && 'extend' in sessions.get(id)!)
      .map((id): [string, DocumentData, boolean] => [id, removeExtend(id), true]),
  ];
  // Fail before anything is written, rather than part way through.
  for (const [id, data, merge] of writes) {
    validateContent(
      'sessions',
      id,
      merge ? { ...withoutExtend(sessions.get(id)!), ...withoutExtend(data) } : data,
    );
  }

  for (const warning of conversion.warnings) console.log(`! ${warning}`);
  for (const [id, time] of Object.entries(conversion.times)) {
    console.log(`sessions/${id}: ${formatTime(time)}`);
  }
  for (const [id, copy] of Object.entries(conversion.copies)) {
    console.log(`sessions/${id}, a copy of ${copy.from}: ${formatTime(copy)}`);
  }
  console.log(`${SITE_CONFIG_PATH} schedule.tracks: ${JSON.stringify(conversion.tracks)}`);
  if (dryRun) {
    console.log('\nDry run: nothing was written.');
    return conversion;
  }

  for (let start = 0; start < writes.length; start += BATCH_SIZE) {
    const batch = firestore.batch();
    for (const [id, data, merge] of writes.slice(start, start + BATCH_SIZE)) {
      batch.set(firestore.collection('sessions').doc(id), data, { merge });
    }
    await batch.commit();
  }
  writeTracks(conversion.tracks);
  console.log(
    `\n✔ Updated ${Object.keys(conversion.times).length} sessions, added ` +
      `${Object.keys(conversion.copies).length} copies, and wrote the tracks to ${SITE_CONFIG_PATH}. ` +
      'Check the schedule, then delete the `schedule` collection.',
  );
  return conversion;
};
