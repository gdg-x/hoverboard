import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { createGoogleCloud, useFirebaseLoginCredentials } from './google-cloud.js';

const dirsToClean: string[] = [];
const originalEnv = { ...process.env };

afterEach(() => {
  for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
  process.env = { ...originalEnv };
});

/** Writes a fake firebase-tools whose API client echoes each request back. */
const makeRepo = (signedIn: boolean): string => {
  const repo = mkdtempSync(join(tmpdir(), 'hoverboard-cli-'));
  dirsToClean.push(repo);
  const lib = join(repo, 'node_modules', 'firebase-tools', 'lib');
  mkdirSync(lib, { recursive: true });
  writeFileSync(join(lib, '..', 'package.json'), '{ "name": "firebase-tools" }');
  writeFileSync(
    join(lib, 'auth.js'),
    `exports.selectAccount = () => (${signedIn} ? { user: { email: 'a@example.com' }, tokens: {} } : undefined);
exports.setActiveAccount = (options, account) => { options.user = account.user; };`,
  );
  writeFileSync(
    join(lib, 'requireAuth.js'),
    `exports.requireAuth = async (options) => { if (!options.user) throw new Error('no user'); };`,
  );
  writeFileSync(
    join(lib, 'apiv2.js'),
    `exports.Client = class {
  constructor(options) { this.options = options; }
  async request(request) {
    return { body: { ...this.options, ...request, queryParams: request.queryParams.toString() } };
  }
};`,
  );
  writeFileSync(
    join(lib, 'defaultCredentials.js'),
    `exports.getCredentialPathAsync = async (account) => '/creds/' + account.user.email + '.json';`,
  );
  return repo;
};

describe('createGoogleCloud', () => {
  it('sends requests as the Firebase CLI account and bills the project', async () => {
    const cloud = await createGoogleCloud(makeRepo(true), 'demo-project');

    const response = await cloud.request(
      'POST',
      'https://iam.googleapis.com/v1/projects/demo-project/locations/global/workloadIdentityPools?workloadIdentityPoolId=github',
      { displayName: 'GitHub' },
    );

    expect(response).toEqual({
      urlPrefix: 'https://iam.googleapis.com',
      auth: true,
      method: 'POST',
      path: '/v1/projects/demo-project/locations/global/workloadIdentityPools',
      queryParams: 'workloadIdentityPoolId=github',
      body: { displayName: 'GitHub' },
      headers: { 'x-goog-user-project': 'demo-project' },
    });
  });

  it('throws when nobody is signed in to the Firebase CLI', async () => {
    delete process.env['GOOGLE_APPLICATION_CREDENTIALS'];

    await expect(createGoogleCloud(makeRepo(false), 'demo-project')).rejects.toThrow(
      'firebase login',
    );
  });
});

describe('useFirebaseLoginCredentials', () => {
  it('points Application Default Credentials at the Firebase CLI account', async () => {
    process.env['GOOGLE_APPLICATION_CREDENTIALS'] = '/other.json';

    await useFirebaseLoginCredentials(makeRepo(true));

    expect(process.env['GOOGLE_APPLICATION_CREDENTIALS']).toBe('/creds/a@example.com.json');
  });

  it('keeps GOOGLE_APPLICATION_CREDENTIALS without a Firebase login', async () => {
    process.env['GOOGLE_APPLICATION_CREDENTIALS'] = '/ci.json';

    await useFirebaseLoginCredentials(makeRepo(false));

    expect(process.env['GOOGLE_APPLICATION_CREDENTIALS']).toBe('/ci.json');
  });

  it('throws when there are no credentials', async () => {
    delete process.env['GOOGLE_APPLICATION_CREDENTIALS'];

    await expect(useFirebaseLoginCredentials(makeRepo(false))).rejects.toThrow('firebase login');
  });
});
