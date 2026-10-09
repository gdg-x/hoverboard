/**
 * Who writes a collection's documents, which says how they are checked.
 *
 * - `content`: organizers, in the Firebase console or with the CLI. The site reads it.
 * - `visitor`: the site, through the Firestore rules. It can hold personal data.
 * - `function`: organizers or Cloud Functions, with the Admin SDK. Only functions read it.
 * - `cli`: the CLI, for its own records.
 */
export type CollectionKind = 'content' | 'visitor' | 'function' | 'cli';

export interface CollectionInfo {
  /** The definition in `schemas/firestore.schema.json` `$defs` that each document follows. */
  readonly schema: string;
  /** The site.json features that use it. It's in use while any of them is on, or always without any. */
  readonly features: readonly string[];
  readonly kind: CollectionKind;
}

/**
 * Every collection Hoverboard uses, by path, where `*` stands for a document ID. A path with an
 * even number of segments is a single document, such as a settings document in `config`.
 */
export const COLLECTIONS = {
  blog: { schema: 'post', features: ['blog'], kind: 'content' },
  gallery: { schema: 'photo', features: ['gallery'], kind: 'content' },
  partners: { schema: 'partnerGroupDocument', features: ['partners'], kind: 'content' },
  'partners/*/items': { schema: 'partner', features: ['partners'], kind: 'content' },
  previousSpeakers: {
    schema: 'previousSpeaker',
    features: ['previousSpeakers'],
    kind: 'content',
  },
  // Speaker pages list their sessions too.
  sessions: { schema: 'session', features: ['schedule', 'speakers'], kind: 'content' },
  // The schedule needs `speakers`, so this covers it.
  speakers: { schema: 'speaker', features: ['speakers'], kind: 'content' },
  team: { schema: 'teamDocument', features: ['team'], kind: 'content' },
  'team/*/members': { schema: 'member', features: ['team'], kind: 'content' },
  tickets: { schema: 'ticket', features: ['tickets'], kind: 'content' },
  videos: { schema: 'video', features: ['videos'], kind: 'content' },

  'sessions/*/feedback': { schema: 'feedback', features: ['feedback'], kind: 'visitor' },
  featuredSessions: { schema: 'featuredSessions', features: ['mySchedule'], kind: 'visitor' },
  notificationsUsers: {
    schema: 'notificationsUser',
    features: ['notifications'],
    kind: 'visitor',
  },
  notificationsSubscribers: {
    schema: 'notificationsSubscriber',
    features: ['notifications'],
    kind: 'visitor',
  },
  subscribers: { schema: 'subscriber', features: ['subscribe'], kind: 'visitor' },
  potentialPartners: { schema: 'potentialPartner', features: ['partners'], kind: 'visitor' },

  'config/notifications': {
    schema: 'notificationsConfig',
    features: ['notifications'],
    kind: 'function',
  },
  notifications: { schema: 'notification', features: ['notifications'], kind: 'function' },
  sentNotifications: {
    schema: 'sentNotification',
    features: ['notifications'],
    kind: 'function',
  },

  'config/migrations': { schema: 'migrations', features: [], kind: 'cli' },
} as const satisfies Record<string, CollectionInfo>;

export type CollectionPath = keyof typeof COLLECTIONS;

/** Fields that earlier versions used, by `$defs` definition, with the version that stopped. */
export const RETIRED_FIELDS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  notificationsConfig: { timezone: '4.0.0' },
  session: { extend: '4.0.0', shortDescription: '4.0.0' },
};

/** Collections and documents that earlier versions used, with the version that stopped. */
export const RETIRED: Readonly<Record<string, string>> = {
  'config/mailchimp': '4.0.0',
  'config/schedule': '4.0.0',
  'config/site': '4.0.0',
  generatedSchedule: '4.0.0',
  generatedSessions: '4.0.0',
  generatedSpeakers: '4.0.0',
  schedule: '4.0.0',
  users: '4.0.0',
};

/** A collection or document path with its document IDs replaced by `*`, such as `team/{*}/members`. */
export const pathPattern = (path: string): string =>
  path
    .split('/')
    .map((segment, index) => (index % 2 === 0 ? segment : '*'))
    .join('/');

/**
 * The registry entry for a collection or document path, if Hoverboard uses it. A document has its
 * own entry, such as `config/notifications`, or its collection's.
 */
export const collectionInfo = (path: string): CollectionInfo | undefined => {
  const registry: Record<string, CollectionInfo> = COLLECTIONS;
  const segments = path.split('/');
  if (segments.length % 2 === 1) return registry[pathPattern(path)];
  return registry[path] ?? registry[pathPattern(segments.slice(0, -1).join('/'))];
};
