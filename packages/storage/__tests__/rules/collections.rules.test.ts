import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { COLLECTIONS, RETIRED, collectionInfo, pathPattern } from '../../collections';

const root = process.cwd();
const rules = readFileSync(join(root, 'packages/storage/firestore.rules'), 'utf8');
const schema = JSON.parse(
  readFileSync(join(root, 'packages/storage/schemas/firestore.schema.json'), 'utf8'),
) as { properties: Record<string, unknown>; $defs: Record<string, unknown> };

const sources = (dir: string) =>
  readdirSync(join(root, dir), { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
    .map((file) => readFileSync(join(root, dir, file), 'utf8'));

/** Collections the web app reads or writes, from `doc(db, 'name'` or `subscribeToDocument(\`name/`. */
const webCollections = new Set(
  sources('packages/web/src/db').flatMap((source) =>
    [
      ...source.matchAll(/(?:doc|collection|collectionGroup)\(\s*db,\s*'([^']+)'/g),
      ...source.matchAll(/subscribeTo\w+(?:<[^>]+>)?\(\s*[`']([A-Za-z]+)/g),
    ].map((match) => match[1]!),
  ),
);

/** Collections the functions read or write, from `.collection('name')`. */
const functionCollections = new Set(
  sources('packages/server/functions/src').flatMap((source) =>
    [...source.matchAll(/\.collection\('([^']+)'\)/g)].map((match) => match[1]!),
  ),
);

/** Collections with a `match` in the rules, such as `blog` and `items`. */
const ruleCollections = new Set(
  [...rules.matchAll(/match \/(?:\{path=\*\*\}\/)?([A-Za-z]+)\/\{/g)]
    .map((match) => match[1]!)
    .filter((name) => name !== 'databases'),
);

const entries = Object.entries(COLLECTIONS);
/** The collection an entry is in, such as `items` for `partners/{*}/items`. */
const collectionName = (path: string) => {
  const segments = path.split('/');
  return segments.at(segments.length % 2 === 0 ? -2 : -1)!;
};
const registered = new Set(entries.map(([path]) => collectionName(path)));

describe('the collection registry', () => {
  it('finds the collections the web app and functions use', () => {
    expect([...webCollections]).toEqual(
      expect.arrayContaining(['featuredSessions', 'feedback', 'subscribers', 'potentialPartners']),
    );
    expect([...functionCollections]).toEqual(
      expect.arrayContaining(['config', 'notificationsSubscribers', 'sentNotifications']),
    );
  });

  it.each([...new Set([...webCollections, ...functionCollections, ...ruleCollections])].sort())(
    'has %s',
    (name) => {
      expect(registered).toContain(name);
    },
  );

  it.each(Object.keys(schema.properties).filter((name) => name !== 'config'))(
    'has the seed collection %s as content',
    (name) => {
      expect(collectionInfo(name)?.kind).toBe('content');
    },
  );

  it.each(entries)('names a schema definition and features for %s', (_path, info) => {
    expect(schema.$defs).toHaveProperty(info.schema);
    expect(info.features.length).toBeGreaterThan(0);
  });

  it.each(entries.filter(([, { kind }]) => kind !== 'function'))(
    'has a rule for %s, which the site reads or writes',
    (path) => {
      expect(ruleCollections).toContain(collectionName(path));
    },
  );

  it.each(entries.filter(([, { kind }]) => kind === 'function'))(
    'has no rule for %s, which only the Admin SDK uses',
    (path) => {
      expect(ruleCollections).not.toContain(collectionName(path));
    },
  );

  it('keeps retired collections out of the registry', () => {
    for (const name of Object.keys(RETIRED)) expect(registered).not.toContain(name);
  });

  it('finds the entry of a collection or document path', () => {
    expect(pathPattern('team/core/members')).toBe('team/*/members');
    expect(collectionInfo('team/core/members')?.schema).toBe('member');
    expect(collectionInfo('team/core/members/ada')?.schema).toBe('member');
    expect(collectionInfo('config/notifications')?.schema).toBe('notificationsConfig');
    expect(collectionInfo('config/site')).toBeUndefined();
    expect(collectionInfo('generatedSessions')).toBeUndefined();
  });
});
