import type { CollectionPath } from '../../../storage/collections';
import type { Stage, TicketSales } from '../../src/utils/stages';

/** The kinds of events in the personas spec. */
export type EventKind = 'first' | 'returning' | 'online' | 'meetup';

/** A document as the sample data has it. */
export interface FixtureDocument {
  path: string;
  data: Record<string, unknown>;
}

/**
 * A site in one or more stages: the demo's site.json with `site` over it, and part of the sample
 * data. Its event is the demo's, on October 13 and 14, 2017, in Kyiv, and `time` puts it in its
 * stages.
 */
export interface StageFixture {
  kind: EventKind;
  /** When the fixture is in its stages, for the dev bar's clock or a test's fake date. */
  time: string;
  /** What `siteStages()` finds at `time`. */
  stages: readonly Stage[];
  ticketSales?: TicketSales;
  /** Changes over the demo's site.json. Objects merge, and arrays and other values replace. */
  site?: Record<string, unknown>;
  /** The sample data's collections it has. The others are empty. */
  collections: readonly CollectionPath[];
  /** Whether it keeps a sample document of those collections. */
  keep?: (document: FixtureDocument) => boolean;
}

const PAST_EDITIONS: CollectionPath[] = [
  'gallery',
  'partners',
  'partners/*/items',
  'previousSpeakers',
  'team',
  'team/*/members',
  'videos',
];
const EVERYTHING: CollectionPath[] = [...PAST_EDITIONS, 'blog', 'sessions', 'speakers', 'tickets'];

const MONTHS_BEFORE = '2017-01-15T10:00:00Z';
// 11:00 on the first day, in Kyiv.
const FIRST_MORNING = '2017-10-13T08:00:00Z';
const WEEKS_AFTER = '2017-10-28T10:00:00Z';

// The sample sessions are on these days, which the fixtures move to the event's.
const SESSION_DAYS: Record<string, string> = {
  '2016-09-09': '2017-10-13',
  '2016-09-10': '2017-10-14',
};

export const STAGE_FIXTURES = {
  'first-announced': {
    kind: 'first',
    time: MONTHS_BEFORE,
    stages: ['announced'],
    collections: [],
  },
  'first-call': {
    kind: 'first',
    time: MONTHS_BEFORE,
    stages: ['announced', 'callForPapers'],
    site: {
      callForPapers: {
        url: 'https://example.com/call-for-papers',
        opens: '2017-01-01',
        closes: '2017-03-31',
      },
    },
    collections: [],
  },
  'first-tickets': {
    kind: 'first',
    time: MONTHS_BEFORE,
    stages: ['announced', 'ticketSales'],
    ticketSales: 'notYetOnSale',
    collections: ['tickets'],
    // Only the tickets with sale dates, the first of which opens on February 7.
    keep: ({ data }) => typeof data['salesOpen'] === 'string',
  },
  'first-schedule': {
    kind: 'first',
    time: '2017-08-01T10:00:00Z',
    stages: ['announced', 'ticketSales', 'schedule'],
    ticketSales: 'onSale',
    collections: ['sessions', 'speakers', 'tickets'],
  },
  'returning-announced': {
    kind: 'returning',
    time: MONTHS_BEFORE,
    stages: ['announced'],
    collections: PAST_EDITIONS,
  },
  'returning-live': {
    kind: 'returning',
    time: FIRST_MORNING,
    stages: ['live'],
    collections: EVERYTHING,
  },
  'online-live': {
    kind: 'online',
    time: FIRST_MORNING,
    stages: ['live'],
    site: {
      event: { attendance: 'online', stream: 'https://www.youtube.com/@GoogleDevelopers/live' },
      features: { map: false },
    },
    collections: ['sessions', 'speakers'],
  },
  'meetup-live': {
    kind: 'meetup',
    time: FIRST_MORNING,
    stages: ['live'],
    site: {
      schedule: { tracks: [{ id: 'conference-hall', title: 'Conference hall' }] },
      features: { partners: false, tickets: false },
    },
    collections: ['sessions', 'speakers', 'team', 'team/*/members'],
    // One track, and the sessions for everyone.
    keep: ({ path, data }) =>
      !path.startsWith('sessions/') ||
      data['track'] === undefined ||
      data['track'] === 'conference-hall',
  },
  'returning-ended': {
    kind: 'returning',
    time: WEEKS_AFTER,
    stages: ['ended'],
    collections: EVERYTHING,
  },
  archived: {
    kind: 'returning',
    time: '2018-01-15T10:00:00Z',
    stages: ['ended', 'archived'],
    site: {
      archive: { year: 2017, current: 'https://example.com/' },
      // As `hb edition switch` turns them off. The blog moves to the next edition.
      features: {
        blog: false,
        demo: false,
        feedback: false,
        forkMe: false,
        functions: false,
        mySchedule: false,
        notifications: false,
        subscribe: false,
      },
    },
    collections: EVERYTHING.filter((collection) => collection !== 'blog'),
  },
} as const satisfies Record<string, StageFixture>;

export type StageFixtureName = keyof typeof STAGE_FIXTURES;

/** The collection a document is in, with its IDs as `*`, such as `team/*\/members`. */
const collectionOf = (path: string) =>
  path
    .split('/')
    .slice(0, -1)
    .map((segment, index) => (index % 2 === 0 ? segment : '*'))
    .join('/');

/** A fixture's documents from the sample data's, with the sessions on the event's days. */
export const fixtureDocuments = <T extends FixtureDocument>(
  fixture: StageFixture,
  documents: readonly T[],
): T[] =>
  documents
    .filter(
      (document) =>
        (fixture.collections as readonly string[]).includes(collectionOf(document.path)) &&
        (fixture.keep?.(document) ?? true),
    )
    .map((document) => {
      const day = document.data['day'];
      return typeof day === 'string' && SESSION_DAYS[day]
        ? { ...document, data: { ...document.data, day: SESSION_DAYS[day] } }
        : document;
    });
