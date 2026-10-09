import { Ajv2020 } from 'ajv/dist/2020.js';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';
import { beforeEach, describe, it } from 'vitest';
import { COLLECTIONS, collectionInfo } from '../../collections';
import { expect } from '../helpers';
import { anonContext, authedContext, seed } from './setup';

const schema = JSON.parse(
  readFileSync(join(process.cwd(), 'packages/storage/schemas/firestore.schema.json'), 'utf8'),
) as { $id: string };
const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true });
ajv.addSchema(schema);

type Data = Record<string, unknown>;

/** Turns the schema's `{ $timestamp }` into a Firestore timestamp, for writing through the rules. */
const toFirestore = (data: Data): Data =>
  Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      const timestamp = (value as { $timestamp?: string } | null)?.$timestamp;
      return [key, timestamp ? Timestamp.fromDate(new Date(timestamp)) : value];
    }),
  );

const entries = (count: number, value: unknown) =>
  Object.fromEntries(Array.from({ length: count }, (_, index) => [`key-${index}`, value]));

interface Fixture {
  /** The document to write. */
  path: string;
  /** The signed-in user who writes it, if any. */
  userId?: string;
  /** Documents the rules need, such as the session a rating is for. */
  existing?: Record<string, Data>;
  valid: Data;
  invalid: [description: string, data: Data][];
}

// What the site writes to each visitor collection, and data both the rules and the schema reject.
const FIXTURES: Record<string, Fixture> = {
  'sessions/*/feedback': {
    path: 'sessions/101/feedback/user-1',
    userId: 'user-1',
    existing: { 'sessions/101': { title: 'Keynote', description: 'Opening talk' } },
    valid: { contentRating: 4, styleRating: 5, comment: 'Great', userId: 'user-1' },
    invalid: [
      ['a rating over 5', { contentRating: 6, styleRating: 5, comment: '', userId: 'user-1' }],
      [
        'a comment over 256 characters',
        { contentRating: 4, styleRating: 5, comment: 'x'.repeat(257), userId: 'user-1' },
      ],
      ['a missing comment', { contentRating: 4, styleRating: 5, userId: 'user-1' }],
      [
        'an extra field',
        { contentRating: 4, styleRating: 5, comment: '', userId: 'user-1', admin: true },
      ],
    ],
  },
  featuredSessions: {
    path: 'featuredSessions/user-1',
    userId: 'user-1',
    valid: { '101': true, '102': false },
    invalid: [['over 500 sessions', entries(501, true)]],
  },
  notificationsUsers: {
    path: 'notificationsUsers/user-1',
    userId: 'user-1',
    valid: { tokens: { 'token-1': true } },
    invalid: [
      ['over 20 tokens', { tokens: entries(21, true) }],
      ['tokens that are not a map', { tokens: 'token-1' }],
      ['no tokens', {}],
      ['an extra field', { tokens: {}, admin: true }],
    ],
  },
  notificationsSubscribers: {
    path: 'notificationsSubscribers/token-1',
    valid: { value: true, updatedAt: { $timestamp: '2026-10-09T10:00:00.000Z' } },
    invalid: [
      ['value false', { value: false, updatedAt: { $timestamp: '2026-10-09T10:00:00.000Z' } }],
      ['a string for updatedAt', { value: true, updatedAt: '2026-10-09' }],
      [
        'an extra field',
        { value: true, updatedAt: { $timestamp: '2026-10-09T10:00:00.000Z' }, topic: 'news' },
      ],
    ],
  },
  subscribers: {
    path: 'subscribers/lead-1',
    valid: { email: 'ada@example.com', firstName: 'Ada', lastName: '' },
    invalid: [
      ['an email without @', { email: 'ada.example.com', firstName: '', lastName: '' }],
      [
        'a name over 100 characters',
        { email: 'ada@example.com', firstName: 'x'.repeat(101), lastName: '' },
      ],
      ['an extra field', { email: 'ada@example.com', firstName: '', lastName: '', admin: true }],
    ],
  },
  potentialPartners: {
    path: 'potentialPartners/lead-1',
    valid: { email: 'ada@example.com', fullName: 'Ada Lovelace', companyName: 'Engines' },
    invalid: [
      [
        'an email with a space',
        { email: 'ada lovelace@example.com', fullName: '', companyName: '' },
      ],
      [
        'a company name over 100 characters',
        { email: 'ada@example.com', fullName: '', companyName: 'x'.repeat(101) },
      ],
      ['a missing name', { email: 'ada@example.com', companyName: '' }],
    ],
  },
};

const visitorCollections = Object.entries(COLLECTIONS)
  .filter(([, { kind }]) => kind === 'visitor')
  .map(([path]) => path);

describe('the schema and the rules', () => {
  it('have a fixture for every visitor collection', () => {
    expect(Object.keys(FIXTURES).sort()).toEqual(visitorCollections.sort());
  });

  describe.each(Object.entries(FIXTURES))('%s', (pattern, fixture) => {
    const validate = ajv.getSchema(`${schema.$id}#/$defs/${collectionInfo(fixture.path)!.schema}`)!;
    const write = (data: Data) => {
      const context = fixture.userId ? authedContext(fixture.userId) : anonContext();
      return setDoc(doc(context.firestore(), fixture.path), toFirestore(data));
    };

    beforeEach(() => (fixture.existing ? seed(fixture.existing) : undefined));

    it('finds the fixture by its path', () => {
      expect(collectionInfo(fixture.path)).toBe(COLLECTIONS[pattern as keyof typeof COLLECTIONS]);
    });

    it('both accept what the site writes', async () => {
      expect(validate(fixture.valid), ajv.errorsText(validate.errors)).toBe(true);
      await expect(write(fixture.valid)).toAllow();
    });

    it.each(fixture.invalid)('both reject %s', async (_description, data) => {
      expect(validate(data)).toBe(false);
      await expect(write(data)).toDeny();
    });
  });
});
