import { createConnection } from 'node:net';
import { env } from 'node:process';
import { type App, applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { type Firestore, getFirestore } from 'firebase-admin/firestore';
import { site } from 'virtual:hoverboard/site';

const APP_NAME = 'hoverboard-build';
const DEFAULT_EMULATOR_HOST = '127.0.0.1:8080';
// `npm start` runs the emulators with this project and imports its data.
const DEMO_PROJECT_ID = 'demo-hoverboard';

/** Resolves when something listens on `host` (`hostname:port`), and rejects otherwise. */
export const checkListening = (host: string, timeout = 2000): Promise<void> => {
  const separator = host.lastIndexOf(':');
  const hostname = host.slice(0, separator).replace(/^\[(.*)\]$/, '$1');
  const port = Number(host.slice(separator + 1));
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host: hostname, port, timeout });
    socket.once('connect', () => {
      socket.end();
      resolve();
    });
    socket.once('timeout', () => socket.destroy(new Error(`Timed out connecting to ${host}`)));
    socket.once('error', reject);
  });
};

const app = (options: Parameters<typeof initializeApp>[0]): App =>
  getApps().find(({ name }) => name === APP_NAME) ?? initializeApp(options, APP_NAME);

/**
 * Firestore for reading content at build time. Like `./hbd`, it uses the emulator unless
 * `FIRESTORE_TARGET=production`, which reads the site's project with Application Default
 * Credentials.
 */
export const connectFirestore = async (): Promise<Firestore> => {
  if (env['FIRESTORE_TARGET'] === 'production') {
    return getFirestore(
      app({ credential: applicationDefault(), projectId: site.firebase.projectId }),
    );
  }

  // The Admin SDK sends every request to the emulator when this is set.
  const host = (env['FIRESTORE_EMULATOR_HOST'] ??= DEFAULT_EMULATOR_HOST);
  // Without a running emulator the SDK retries for minutes, so fail early instead.
  await checkListening(host).catch((error: unknown) => {
    throw new Error(
      `The Firestore emulator is not running at ${host}. Start it with \`npm start\`, build ` +
        'from production with FIRESTORE_TARGET=production, or without content with ' +
        'FIRESTORE_TARGET=none.',
      { cause: error },
    );
  });
  return getFirestore(app({ projectId: DEMO_PROJECT_ID }));
};
