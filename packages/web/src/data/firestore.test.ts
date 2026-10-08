import { createServer, type Server } from 'node:net';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { site } from 'virtual:hoverboard/site';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkListening, connectFirestore } from './firestore';

vi.mock('firebase-admin/app', () => ({
  applicationDefault: vi.fn(() => 'credential'),
  getApps: vi.fn(() => []),
  initializeApp: vi.fn(() => 'app'),
}));
vi.mock('firebase-admin/firestore', () => ({ getFirestore: vi.fn(() => 'firestore') }));

const listen = async (): Promise<[Server, string]> => {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as { port: number };
  return [server, `127.0.0.1:${port}`];
};

const close = (server: Server) => new Promise((resolve) => server.close(resolve));

// A port that was just free, so nothing listens on it.
const unusedHost = async () => {
  const [server, host] = await listen();
  await close(server);
  return host;
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('checkListening', () => {
  it('resolves when something listens on the host', async () => {
    const [server, host] = await listen();

    await expect(checkListening(host)).resolves.toBeUndefined();
    await close(server);
  });

  it('rejects when nothing listens on the host', async () => {
    await expect(checkListening(await unusedHost())).rejects.toThrow();
  });
});

describe('connectFirestore', () => {
  it('uses the emulator with the demo project by default', async () => {
    const [server, host] = await listen();
    vi.stubEnv('FIRESTORE_TARGET', undefined);
    vi.stubEnv('FIRESTORE_EMULATOR_HOST', host);

    await expect(connectFirestore()).resolves.toBe('firestore');
    expect(initializeApp).toHaveBeenCalledWith(
      { projectId: 'demo-hoverboard' },
      'hoverboard-build',
    );
    expect(getFirestore).toHaveBeenCalledWith('app');
    await close(server);
  });

  it('explains how to start the emulator when it is not running', async () => {
    const host = await unusedHost();
    vi.stubEnv('FIRESTORE_TARGET', undefined);
    vi.stubEnv('FIRESTORE_EMULATOR_HOST', host);

    await expect(connectFirestore()).rejects.toThrow(
      `The Firestore emulator is not running at ${host}. Start it with \`npm start\``,
    );
    expect(initializeApp).not.toHaveBeenCalled();
  });

  it("reads the site's project with Application Default Credentials in production", async () => {
    vi.stubEnv('FIRESTORE_TARGET', 'production');

    await expect(connectFirestore()).resolves.toBe('firestore');
    expect(applicationDefault).toHaveBeenCalled();
    expect(initializeApp).toHaveBeenCalledWith(
      { credential: 'credential', projectId: site.firebase.projectId },
      'hoverboard-build',
    );
  });
});
