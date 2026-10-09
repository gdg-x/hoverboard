import { env } from 'node:process';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const APP_NAME = 'hoverboard-dev-content';
const DEFAULT_EMULATOR_HOST = '127.0.0.1:8080';
// `npm start` runs the emulators with this project and imports its data.
const DEMO_PROJECT_ID = 'demo-hoverboard';

/**
 * Calls `onChange` with the name of a collection in the Firestore emulator whenever its documents
 * change, starting with their first snapshot. A listener that fails, for example because the
 * emulator is not up yet, starts again after `retryMs`. Returns a function that stops them. Does
 * nothing with `FIRESTORE_TARGET` set.
 */
export const watchEmulatorContent = (
  collections: readonly string[],
  onChange: (collection: string) => void,
  retryMs = 2000,
): (() => void) => {
  if (env['FIRESTORE_TARGET'] || !collections.length) return () => undefined;
  env['FIRESTORE_EMULATOR_HOST'] ??= DEFAULT_EMULATOR_HOST;
  const app =
    getApps().find(({ name }) => name === APP_NAME) ??
    initializeApp({ projectId: DEMO_PROJECT_ID }, APP_NAME);
  const db = getFirestore(app);
  const stops = new Map<string, () => void>();
  const retries = new Set<ReturnType<typeof setTimeout>>();
  const listen = (collection: string) => {
    stops.set(
      collection,
      db.collection(collection).onSnapshot(
        () => onChange(collection),
        () => {
          const retry = setTimeout(() => {
            retries.delete(retry);
            listen(collection);
          }, retryMs);
          retries.add(retry);
        },
      ),
    );
  };
  collections.forEach(listen);
  return () => {
    retries.forEach(clearTimeout);
    stops.forEach((stop) => stop());
  };
};
