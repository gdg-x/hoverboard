import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { COLLECTIONS } from '../../collections';
import { expect } from '../helpers';

// Its own project, so the archive rules don't replace the current ones that setup.ts loads.
let archive: RulesTestEnvironment;

beforeAll(async () => {
  archive = await initializeTestEnvironment({
    projectId: `archive-rules-${process.pid}-${Date.now()}`,
    firestore: {
      rules: readFileSync(join(process.cwd(), 'packages/storage/firestore.archive.rules'), 'utf8'),
      host: 'localhost',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await archive.cleanup();
});

/** A document in each registry path, such as `sessions/x/feedback/x`. */
const documentPath = (entry: string) =>
  entry.split('/').length % 2 ? `${entry.replaceAll('*', 'x')}/x` : entry.replaceAll('*', 'x');

const READABLE = Object.entries(COLLECTIONS)
  .filter(([entry, { kind }]) => kind === 'content' || entry === 'sessions/*/reactions')
  .map(([entry]) => entry);

describe('the archive rules', () => {
  describe.each(Object.keys(COLLECTIONS))('%s', (entry) => {
    const path = documentPath(entry);
    const readable = READABLE.includes(entry);

    it('can be read only if the archive shows it', async () => {
      const read = getDoc(doc(archive.unauthenticatedContext().firestore(), path));
      await (readable ? expect(read).toAllow() : expect(read).toDeny());
    });

    it("can't be written, even by a signed-in visitor", async () => {
      await expect(
        setDoc(doc(archive.authenticatedContext('x').firestore(), path), { userId: 'x' }),
      ).toDeny();
    });
  });
});
