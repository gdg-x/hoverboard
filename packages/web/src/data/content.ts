import type {
  DocumentData,
  Firestore,
  Query,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { env } from 'node:process';
import type { Feature } from '../config/features';
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
  schedule: ['schedule', (db) => read(db.collection('generatedSchedule').orderBy('date'), withId)],
  // The speakers page builds its filters from session tags.
  sessions: [
    ['schedule', 'speakers'],
    (db) => read(db.collection('generatedSessions').orderBy('id'), withId),
  ],
  speakers: ['speakers', (db) => read(db.collection('generatedSpeakers').orderBy('name'), withId)],
  teams: ['team', (db) => read(db.collection('team').orderBy('title'), withId)],
  tickets: ['tickets', (db) => read(db.collection('tickets').orderBy('order'), withId)],
  videos: ['videos', (db) => read(db.collection('videos').orderBy('order'), withId)],
} satisfies Record<
  keyof Content,
  [Feature | Feature[], (db: Firestore) => Promise<DocumentData[]>]
>;

const enabledLoaders = () =>
  Object.entries(LOADERS).filter(([, [features]]) =>
    [features].flat().some((feature) => __HB_FEATURES__[feature]),
  );

/** Reads the content of the enabled features. Disabled features have no key. */
export const readContent = async (db: Firestore): Promise<Partial<Content>> => {
  const entries = await Promise.all(
    enabledLoaders().map(async ([name, [, load]]) => [name, await load(db)] as const),
  );
  // Firestore data is untyped. The models in src/models/ describe it, as they do for the client.
  return Object.fromEntries(entries) as Partial<Content>;
};

/** Every enabled collection, empty, for builds without Firestore such as CI checks. */
export const emptyContent = (): Partial<Content> =>
  Object.fromEntries(enabledLoaders().map(([name]) => [name, []]));

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
