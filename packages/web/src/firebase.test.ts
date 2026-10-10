import { getAnalytics } from 'firebase/analytics';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getPerformance } from 'firebase/performance';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.unmock('./firebase');
vi.mock('firebase/app');
vi.mock('firebase/firestore');
vi.mock('firebase/analytics');
vi.mock('firebase/performance');

const load = async (projectId: string) => {
  vi.resetModules();
  window.firebaseConfig = { projectId, appId: 'app-id' };
  return import('./firebase');
};

afterEach(() => {
  vi.clearAllMocks();
  delete window.firebaseConfig;
});

describe('firebase', () => {
  it('shares one cache between tabs', async () => {
    const tabManager = { kind: 'PersistentMultipleTab' };
    const localCache = { kind: 'persistent' };
    vi.mocked(persistentMultipleTabManager).mockReturnValue(tabManager as never);
    vi.mocked(persistentLocalCache).mockReturnValue(localCache as never);

    await load('demo-hoverboard');

    expect(persistentLocalCache).toHaveBeenCalledWith({ tabManager });
    expect(initializeFirestore).toHaveBeenCalledWith(undefined, { localCache });
  });

  it('uses the emulators for demo projects', async () => {
    const { isDemoProject, analytics } = await load('demo-hoverboard');

    expect(isDemoProject).toBe(true);
    expect(connectFirestoreEmulator).toHaveBeenCalledWith(undefined, '127.0.0.1', 8080);
    expect(analytics).toBeUndefined();
    expect(getAnalytics).not.toHaveBeenCalled();
    expect(getPerformance).not.toHaveBeenCalled();
  });

  it('uses the real services for other projects', async () => {
    const { isDemoProject } = await load('hoverboard-master');

    expect(isDemoProject).toBe(false);
    expect(connectFirestoreEmulator).not.toHaveBeenCalled();
    expect(getAnalytics).toHaveBeenCalled();
    expect(getPerformance).toHaveBeenCalled();
  });

  it('starts nothing on the server, and throws when used there', async () => {
    vi.resetModules();
    vi.doMock('lit', () => ({ isServer: true }));
    const { db, firebaseApp, analytics } = await import('./firebase');
    vi.doUnmock('lit');

    expect(connectFirestoreEmulator).not.toHaveBeenCalled();
    expect(analytics).toBeUndefined();
    expect(() => db.type).toThrow('db is not available on the server');
    expect(() => firebaseApp.name).toThrow('firebaseApp is not available on the server');
  });
});
