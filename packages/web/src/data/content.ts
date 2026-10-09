import type {
  DocumentData,
  Firestore,
  Query,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { env } from 'node:process';
import { site } from 'virtual:hoverboard/site';
import { COLLECTIONS, type CollectionPath } from '../../../storage/collections';
import { documentUrl } from '../../../storage/messages';
import { documentMessages, toJson } from '../../../storage/validate';
import type { Feature } from '../config/features';
import { scheduleTracks } from '../config/site';
import { scheduleErrors } from '../schedule/build-schedule';
import type { Content } from '../store/content';
import { connectFirestore } from './firestore';

const withId = (doc: QueryDocumentSnapshot): DocumentData => ({ ...doc.data(), id: doc.id });

// Documents of a collection group carry the ID of the document their collection is under.
const withParentId = (doc: QueryDocumentSnapshot): DocumentData => ({
  ...doc.data(),
  parentId: doc.ref.parent.parent?.id,
  id: doc.id,
});

type ToData = (doc: QueryDocumentSnapshot) => DocumentData;

// The same queries as the subscriptions in src/db/, with the collection whose features they need.
const LOADERS = {
  blog: ['blog', (db) => db.collection('blog').orderBy('published', 'desc'), withId],
  gallery: ['gallery', (db) => db.collection('gallery').orderBy('order'), withId],
  members: ['team/*/members', (db) => db.collectionGroup('members').orderBy('name'), withParentId],
  partnerGroups: ['partners', (db) => db.collection('partners').orderBy('order'), withId],
  partners: [
    'partners/*/items',
    (db) => db.collectionGroup('items').orderBy('order'),
    withParentId,
  ],
  previousSpeakers: [
    'previousSpeakers',
    (db) => db.collection('previousSpeakers').orderBy('name'),
    withId,
  ],
  sessions: ['sessions', (db) => db.collection('sessions'), withId],
  speakers: ['speakers', (db) => db.collection('speakers'), withId],
  teams: ['team', (db) => db.collection('team').orderBy('title'), withId],
  tickets: ['tickets', (db) => db.collection('tickets').orderBy('order'), withId],
  videos: ['videos', (db) => db.collection('videos').orderBy('order'), withId],
} satisfies Record<keyof Content, [CollectionPath, (db: Firestore) => Query, ToData]>;

const inUse = (path: CollectionPath) =>
  COLLECTIONS[path].features.some((feature) => __HB_FEATURES__[feature as Feature]);

const enabledLoaders = () => Object.entries(LOADERS).filter(([, [path]]) => inUse(path));

/** The problems with the documents, against firestore.schema.json, with links to them. */
const contentProblems = (docs: QueryDocumentSnapshot[]): string[] => {
  const projectId = env['FIRESTORE_TARGET'] === 'production' ? site.firebase.projectId : undefined;
  return docs.flatMap((doc) =>
    documentMessages(doc.ref.path, toJson(doc.data()), {
      url: documentUrl(doc.ref.path, projectId),
    }),
  );
};

/**
 * Warns about invalid content of features that are off, which the site doesn't read, so it is
 * right before a feature is turned on.
 */
const warnAboutUnusedContent = async (db: Firestore) => {
  const unused = Object.entries(COLLECTIONS).filter(
    ([path, { kind }]) => kind === 'content' && !inUse(path as CollectionPath),
  );
  const snapshots = await Promise.all(
    unused.map(async ([path, { features }]) => {
      // Partner items and team members are read as collection groups, like the site does.
      const query = path.includes('/')
        ? db.collectionGroup(path.split('/').pop()!)
        : db.collection(path);
      return [features, (await query.get()).docs] as const;
    }),
  );
  for (const [features, docs] of snapshots) {
    const names = features.map((feature) => `features.${feature}`).join(' and ');
    for (const problem of contentProblems(docs)) {
      console.warn(
        `${problem} Not a build error, because ${names} ${features.length === 1 ? 'is' : 'are'} off. Fix it before turning it on.`,
      );
    }
  }
};

const scheduleProblems = ({ sessions = [] }: Partial<Content>): string[] => {
  // Sessions from before v4 got their times from the `schedule` collection.
  if (__HB_FEATURES__.schedule && sessions.length && !sessions.some(({ day }) => day)) {
    console.warn(
      `None of the ${sessions.length} sessions has a day and times, so the schedule is empty. ` +
        'Sessions from before v4 need `./hb firestore-check --fix`. See docs/tutorials/firebase-utils.md.',
    );
  }
  return scheduleErrors(sessions, scheduleTracks);
};

/** Reads the content of the enabled features. Disabled features have no key. */
export const readContent = async (db: Firestore): Promise<Partial<Content>> => {
  const loaded = await Promise.all(
    enabledLoaders().map(async ([name, [, query, map]]) => {
      const { docs } = await query(db).get();
      return { name, docs, data: docs.map(map) };
    }),
  );
  // Firestore data is untyped. The models in src/models/ describe it, as they do for the client.
  const content = Object.fromEntries(
    loaded.map(({ name, data }) => [name, data]),
  ) as Partial<Content>;
  const problems = [
    ...contentProblems(loaded.flatMap(({ docs }) => docs)),
    ...scheduleProblems(content),
  ];
  if (problems.length) {
    const message =
      `The content in Firestore has problems:\n${problems.map((problem) => `  ${problem}`).join('\n')}\n` +
      'Fix them in the Firebase console, then check with `./hb firestore-check`. ' +
      '`./hb firestore-check --fix` fixes some of them.';
    // In development, the content can be halfway through an edit.
    if (!import.meta.env.DEV) throw new Error(message);
    console.warn(message);
  }
  if (!import.meta.env.DEV) await warnAboutUnusedContent(db);
  return content;
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
