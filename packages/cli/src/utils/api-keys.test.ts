import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import type { GoogleCloud } from '../lib/google-cloud.js';
import { checkApiKeys, keyProblems, referrerAllows } from './api-keys.js';

const KEYS = 'https://apikeys.googleapis.com/v2';
const WEB_KEY = 'projects/123/locations/global/keys/web-key';
const SITE_HOSTS = ['demo-project.web.app', 'demo-project.firebaseapp.com'];
const FIREBASE_APIS = ['firestore.googleapis.com', 'identitytoolkit.googleapis.com'];

const key = (referrers: string[], services: string[], name = WEB_KEY) => ({
  name,
  restrictions: {
    ...(referrers.length ? { browserKeyRestrictions: { allowedReferrers: referrers } } : {}),
    ...(services.length ? { apiTargets: services.map((service) => ({ service })) } : {}),
  },
});

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const makeRepo = (site: object = {}) => {
  const dir = mkdtempSync(join(tmpdir(), 'hoverboard-keys-'));
  dirs.push(dir);
  mkdirSync(join(dir, 'packages', 'config'), { recursive: true });
  writeFileSync(join(dir, 'packages', 'config', 'site.json'), JSON.stringify(site));
  return dir;
};

/** A fake Google Cloud with one web app and these keys, by their string or name. */
const fakeCloud = (
  keys: Record<string, ReturnType<typeof key>>,
  keyStrings: Record<string, string> = {},
) => {
  const cloud: GoogleCloud = {
    async request<T>(_method: string, url: string): Promise<T> {
      if (url.endsWith('/webApps')) return { apps: [{ apiKeyId: 'web-key' }] } as T;
      if (url.startsWith(`${KEYS}/keys:lookupKey`)) {
        const name = keyStrings[new URL(url).searchParams.get('keyString') ?? ''];
        if (!name) throw Object.assign(new Error('Not found'), { status: 404 });
        return { name } as T;
      }
      const id = url.split('/').pop() ?? '';
      const found = Object.values(keys).find(({ name }) => name.endsWith(`/${id}`));
      if (!found) throw Object.assign(new Error('Permission denied'), { status: 403 });
      return found as T;
    },
  };
  return async () => cloud;
};

describe('referrerAllows', () => {
  it.each([
    ['demo-project.web.app', 'demo-project.web.app', true],
    ['https://demo-project.web.app/*', 'demo-project.web.app', true],
    ['*.example.com/*', 'devfest.example.com', true],
    ['demo-project--*.web.app', 'demo-project--pr1-abc.web.app', true],
    ['demo-project--*.web.app', 'attacker.web.app', false],
    ['*.web.app', 'attacker.web.app', true],
    ['*', 'attacker.example', true],
    ['localhost:5000', 'localhost', true],
    ['example.com', 'devfest.example.com', false],
  ])('%s allows %s: %s', (pattern, host, allowed) => {
    expect(referrerAllows(pattern, host)).toBe(allowed);
  });
});

describe('keyProblems', () => {
  it('passes a key restricted to the hosts and to Firebase APIs', () => {
    expect(
      keyProblems(key(SITE_HOSTS, FIREBASE_APIS), 'The key', { hosts: SITE_HOSTS, firebase: true }),
    ).toEqual([]);
  });

  it('warns about a key without restrictions', () => {
    expect(keyProblems(key([], []), 'The key', { hosts: SITE_HOSTS, firebase: true })).toEqual([
      'The key works from any website. Restrict it to demo-project.web.app, demo-project.firebaseapp.com.',
      'The key can call every API the project has on. Limit it to the APIs the site uses.',
    ]);
  });

  it('warns about a missing host, a pattern that allows other sites, and a missing API', () => {
    expect(
      keyProblems(key(['demo-project.web.app', '*.web.app'], FIREBASE_APIS), 'The key', {
        hosts: SITE_HOSTS,
        firebase: true,
        maps: true,
      }),
    ).toEqual([
      "The key doesn't allow demo-project.firebaseapp.com.",
      "The key allows other people's sites: *.web.app.",
      "The key can't call maps-backend.googleapis.com, which the map needs.",
    ]);
  });

  it("warns about APIs the site doesn't call with the key", () => {
    const services = [...FIREBASE_APIS, 'maps-backend.googleapis.com', 'bigquery.googleapis.com'];

    expect(
      keyProblems(key(SITE_HOSTS, services), 'The key', { hosts: SITE_HOSTS, firebase: true }),
    ).toEqual([
      "The key can call APIs the site doesn't use: maps-backend.googleapis.com, bigquery.googleapis.com.",
    ]);
    expect(
      keyProblems(key(SITE_HOSTS, services), 'The key', { hosts: SITE_HOSTS, maps: true }),
    ).toEqual([
      "The key can call APIs the site doesn't use: firestore.googleapis.com, identitytoolkit.googleapis.com, bigquery.googleapis.com.",
    ]);
  });
});

describe('checkApiKeys', () => {
  it('skips without a Firebase project', async () => {
    expect(await checkApiKeys(undefined, undefined)).toMatchObject({ ok: true, warning: true });
  });

  it("passes when the web app's key is restricted to the site", async () => {
    const createCloud = fakeCloud({ web: key(SITE_HOSTS, FIREBASE_APIS) });

    expect(await checkApiKeys(makeRepo(), 'demo-project', { createCloud })).toEqual({
      name: 'Browser API key',
      ok: true,
      message:
        'Restricted to demo-project.web.app, demo-project.firebaseapp.com and to the APIs the site uses.',
    });
  });

  it("checks the site's custom domain", async () => {
    const createCloud = fakeCloud({ web: key(SITE_HOSTS, FIREBASE_APIS) });
    const repo = makeRepo({ url: 'https://devfest.example.com/' });

    expect((await checkApiKeys(repo, 'demo-project', { createCloud })).message).toBe(
      "The browser key doesn't allow devfest.example.com. Edit it at " +
        'https://console.cloud.google.com/apis/credentials/key/web-key?project=demo-project.',
    );
  });

  it('checks that a web key used for Maps can call the Maps API', async () => {
    const createCloud = fakeCloud({ web: key(SITE_HOSTS, FIREBASE_APIS) }, { 'AIza-web': WEB_KEY });
    const repo = makeRepo({ integrations: { googleMapsApiKey: 'AIza-web' } });

    expect((await checkApiKeys(repo, 'demo-project', { createCloud })).message).toContain(
      "The browser key, also the Maps key, can't call maps-backend.googleapis.com",
    );
  });

  it('allows the Maps API on the web key only while it is the Maps key', async () => {
    const createCloud = fakeCloud(
      { web: key(SITE_HOSTS, [...FIREBASE_APIS, 'maps-backend.googleapis.com']) },
      { 'AIza-web': WEB_KEY },
    );
    const repo = makeRepo({ integrations: { googleMapsApiKey: 'AIza-web' } });

    expect((await checkApiKeys(repo, 'demo-project', { createCloud })).warning).toBeUndefined();
    expect((await checkApiKeys(makeRepo(), 'demo-project', { createCloud })).message).toContain(
      "The browser key can call APIs the site doesn't use: maps-backend.googleapis.com.",
    );
  });

  it('checks a separate Maps key, and only while the map is on', async () => {
    const mapsKey = key(
      [],
      ['maps-backend.googleapis.com'],
      'projects/123/locations/global/keys/maps',
    );
    const createCloud = fakeCloud(
      { web: key(SITE_HOSTS, FIREBASE_APIS), maps: mapsKey },
      { 'AIza-maps': mapsKey.name },
    );

    expect(
      (
        await checkApiKeys(
          makeRepo({ integrations: { googleMapsApiKey: 'AIza-maps' } }),
          'demo-project',
          {
            createCloud,
          },
        )
      ).message,
    ).toContain(
      'The Maps key works from any website. Restrict it to demo-project.web.app. Edit it at ' +
        'https://console.cloud.google.com/apis/credentials/key/maps?project=123.',
    );
    expect(
      (
        await checkApiKeys(
          makeRepo({ integrations: { googleMapsApiKey: 'AIza-maps' }, features: { map: false } }),
          'demo-project',
          { createCloud },
        )
      ).warning,
    ).toBeUndefined();
  });

  it('says how to turn on the API Keys API when it is off', async () => {
    const result = await checkApiKeys(makeRepo(), 'demo-project', {
      createCloud: async () => ({
        request: async <T>(_method: string, url: string): Promise<T> => {
          if (url.endsWith('/webApps')) return { apps: [{ apiKeyId: 'web-key' }] } as T;
          throw new Error('API Keys API has not been used in project demo-project before');
        },
      }),
    });

    expect(result).toMatchObject({ ok: true, warning: true });
    expect(result.message).toContain(
      'https://console.cloud.google.com/apis/library/apikeys.googleapis.com?project=demo-project',
    );
  });
});
