import { env } from 'node:process';
import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { readContent } from './content';
import { sampleDocuments, sampleFirestore } from './sample';

// The emulator from the global setup, with a project of its own, so other data in it is untouched.
const host = (env['FIRESTORE_EMULATOR_HOST'] ??= '127.0.0.1:8080');
const projectId = `demo-sample-data-${process.pid}`;
const app = initializeApp({ projectId }, projectId);
const emulator = getFirestore(app);

const clear = () =>
  fetch(`http://${host}/emulator/v1/projects/${projectId}/databases/(default)/documents`, {
    method: 'DELETE',
  });

beforeAll(async () => {
  await clear();
  await Promise.all(sampleDocuments().map(({ path, data }) => emulator.doc(path).set(data)));
});

afterAll(async () => {
  await clear();
  await deleteApp(app);
});

it('reads the same content from docs/sample-data as from the emulator seeded with it', async () => {
  const fromEmulator = await readContent(emulator);

  expect(fromEmulator.sessions?.length).toBeGreaterThan(0);
  expect(await readContent(sampleFirestore())).toEqual(fromEmulator);
});
