import type {
  DocumentData,
  Firestore,
  Query,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { env } from 'node:process';
import type { Feature } from '../config/features';
import { disabledSchedule, scheduleTracks } from '../config/site';
import type { Session } from '../models/session';
import type { Speaker } from '../models/speaker';
import { buildSchedule, scheduleErrors } from '../schedule/build-schedule';
import type { Content } from '../store/content';
import { connectFirestore } from './firestore';

const withId = (doc: QueryDocumentSnapshot): DocumentData => ({ ...doc.data(), id: doc.id });

// Documents of a collection group carry the ID of the document their collection is under.
const withParentId = (doc: QueryDocumentSnapshot): DocumentData => ({
  ...doc.data(),
  parentId: doc.ref.parent.parent?.id,
  id: doc.id,
});

const read = async (
  query: Query,
  map: (doc: QueryDocumentSnapshot) => DocumentData,
): Promise<DocumentData[]> => (await query.get()).docs.map(map);

// The same queries as the subscriptions in src/db/, and the features that read each one.
const LOADERS = {
  blog: ['blog', (db) => read(db.collection('blog').orderBy('published', 'desc'), withId)],
  gallery: ['gallery', (db) => read(db.collection('gallery').orderBy('order'), withId)],
  members: ['team', (db) => read(db.collectionGroup('members').orderBy('name'), withParentId)],
  partnerGroups: ['partners', (db) => read(db.collection('partners').orderBy('order'), withId)],
  partners: ['partners', (db) => read(db.collectionGroup('items').orderBy('order'), withParentId)],
  previousSpeakers: [
    'previousSpeakers',
    (db) => read(db.collection('previousSpeakers').orderBy('name'), withId),
  ],
  teams: ['team', (db) => read(db.collection('team').orderBy('title'), withId)],
  tickets: ['tickets', (db) => read(db.collection('tickets').orderBy('order'), withId)],
  videos: ['videos', (db) => read(db.collection('videos').orderBy('order'), withId)],
} satisfies Record<
  Exclude<keyof Content, ScheduleKey>,
  [Feature, (db: Firestore) => Promise<DocumentData[]>]
>;

type ScheduleKey = 'schedule' | 'sessions' | 'speakers';

// Built from the raw `sessions` and `speakers`. The speakers page builds its filters from session tags.
const SCHEDULE_FEATURES: Record<ScheduleKey, Feature[]> = {
  schedule: ['schedule'],
  sessions: ['schedule', 'speakers'],
  speakers: ['speakers'],
};

const isEnabled = (features: Feature | Feature[]) =>
  [features].flat().some((feature) => __HB_FEATURES__[feature]);

const enabledLoaders = () => Object.entries(LOADERS).filter(([, [feature]]) => isEnabled(feature));

const enabledScheduleKeys = () =>
  (Object.keys(SCHEDULE_FEATURES) as ScheduleKey[]).filter((key) =>
    isEnabled(SCHEDULE_FEATURES[key]),
  );

const readSchedule = async (db: Firestore, keys: ScheduleKey[]) => {
  if (!keys.length) return [];
  const [sessions, speakers] = (await Promise.all([
    read(db.collection('sessions'), withId),
    read(db.collection('speakers'), withId),
  ])) as [Session[], Speaker[]];
  const errors = scheduleErrors(sessions, scheduleTracks);
  if (errors.length) {
    const message = `The schedule has problems:\n${errors.map((error) => `  ${error}`).join('\n')}`;
    // In development, the content can be halfway through an edit.
    if (!import.meta.env.DEV) throw new Error(message);
    console.warn(message);
  }
  const built = buildSchedule(
    { sessions, speakers },
    { published: !disabledSchedule, tracks: scheduleTracks },
  );
  return keys.map((key) => [key, built[key]] as const);
};

/** Reads the content of the enabled features. Disabled features have no key. */
export const readContent = async (db: Firestore): Promise<Partial<Content>> => {
  const [entries, schedule] = await Promise.all([
    Promise.all(enabledLoaders().map(async ([name, [, load]]) => [name, await load(db)] as const)),
    readSchedule(db, enabledScheduleKeys()),
  ]);
  // Firestore data is untyped. The models in src/models/ describe it, as they do for the client.
  return Object.fromEntries([...entries, ...schedule]) as Partial<Content>;
};

/** Every enabled collection, empty, for builds without Firestore such as CI checks. */
export const emptyContent = (): Partial<Content> =>
  Object.fromEntries(
    [...enabledLoaders().map(([name]) => name), ...enabledScheduleKeys()].map((name) => [name, []]),
  );

let content: Promise<Partial<Content>> | undefined;

/**
 * The content for this build, read once and shared by every page. Development reads it fresh.
 * `FIRESTORE_TARGET=none` builds without Firestore and without content.
 */
export const loadContent = (): Promise<Partial<Content>> => {
  if (env['FIRESTORE_TARGET'] === 'none') return Promise.resolve(emptyContent());
  if (import.meta.env.DEV) return connectFirestore().then(readContent);
  content ??= connectFirestore().then(readContent);
  return content;
};
