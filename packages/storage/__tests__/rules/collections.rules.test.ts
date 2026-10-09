import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const rules = readFileSync(join(root, 'packages/storage/firestore.rules'), 'utf8');
const schema = JSON.parse(
  readFileSync(join(root, 'packages/storage/schemas/content.schema.json'), 'utf8'),
) as { properties: Record<string, unknown> };

const webDb = join(root, 'packages/web/src/db');
const webSources = readdirSync(webDb)
  .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
  .map((file) => readFileSync(join(webDb, file), 'utf8'));
/** Collections the web app reads or writes, from `doc(db, 'name'` or `subscribeToDocument(\`name/`. */
const webCollections = new Set(
  webSources.flatMap((source) =>
    [
      ...source.matchAll(/(?:doc|collection|collectionGroup)\(\s*db,\s*'([^']+)'/g),
      ...source.matchAll(/subscribeTo\w+(?:<[^>]+>)?\(\s*[`']([A-Za-z]+)/g),
    ].map((match) => match[1]!),
  ),
);

// `config` is only read with the Admin SDK, so the default deny covers it.
const contentCollections = Object.keys(schema.properties).filter((name) => name !== 'config');

describe('firestore.rules', () => {
  it('finds the collections the web app uses', () => {
    expect([...webCollections]).toEqual(
      expect.arrayContaining(['featuredSessions', 'feedback', 'subscribers', 'potentialPartners']),
    );
  });

  it.each([...new Set([...contentCollections, ...webCollections])].sort())(
    'has a rule for %s',
    (name) => {
      expect(rules).toContain(`/${name}/{`);
    },
  );
});
