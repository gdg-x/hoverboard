import { execFileSync } from 'child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { type Server, createServer } from 'net';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setTarget } from '../lib/target.js';
import { runStatus } from './status.js';

const mocks = vi.hoisted(() => {
  const counts: Record<string, number> = { speakers: 12, sessions: 30, feedback: 4 };
  const count = (name: string) => ({
    count: () => ({ get: async () => ({ data: () => ({ count: counts[name] ?? 0 }) }) }),
  });
  return {
    request: vi.fn(async (): Promise<unknown> => ({
      releases: [
        {
          releaseTime: '2027-10-01T10:00:00Z',
          releaseUser: { email: 'ada@example.com' },
          message: 'Deploy',
        },
      ],
    })),
    firestore: {
      collection: vi.fn(count),
      collectionGroup: vi.fn(count),
      doc: vi.fn((path: string) => ({
        get: async () => ({ exists: path === 'config/migrations' }),
      })),
    },
  };
});

vi.mock('../lib/google-cloud.js', () => ({
  createGoogleCloud: async () => ({ request: mocks.request }),
}));
vi.mock('../lib/firestore.js', () => ({ firestore: mocks.firestore }));

const env = {
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'Test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'Test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
};

let repo: string;
let server: Server | undefined;
const run = (...args: string[]) =>
  execFileSync('git', args, { cwd: repo, encoding: 'utf8', env: { ...process.env, ...env } });
const write = (path: string, content: unknown) => {
  mkdirSync(dirname(join(repo, path)), { recursive: true });
  writeFileSync(join(repo, path), typeof content === 'string' ? content : JSON.stringify(content));
};
const output = () =>
  vi
    .mocked(console.log)
    .mock.calls.map(([line]) => String(line))
    .join('\n');

/** A port that accepts connections, standing in for the emulator. */
const listen = () =>
  new Promise<string>((resolve) => {
    server = createServer((socket) => socket.end()).listen(0, '127.0.0.1', () => {
      const address = server!.address();
      resolve(`127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`);
    });
  });

beforeEach(() => {
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
  vi.stubEnv('GCLOUD_PROJECT', undefined);
  repo = mkdtempSync(join(tmpdir(), 'hoverboard-status-'));
  write('package.json', { version: '4.0.0' });
  write('packages/web/defaults/site.json', {
    features: { speakers: true, schedule: true, feedback: false, blog: true },
  });
  write('packages/config/site.json', {
    schemaVersion: 3,
    firebase: { projectId: 'fest-2027' },
    features: { blog: false, feedback: true },
  });
  write('src/app.ts', 'upstream');
  run('init', '--quiet', '--initial-branch=main');
  run('add', '.');
  run('commit', '--quiet', '-m', 'feat: v4');
  run('tag', 'v4.0.0');
  write('src/app.ts', 'changed');
  write('packages/config/content/resources.json', '{}');
  run('add', '.');
  run('commit', '--quiet', '-m', 'feat: the site');
  vi.spyOn(process, 'cwd').mockReturnValue(repo);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  server?.close();
  server = undefined;
  setTarget('emulator');
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  rmSync(repo, { recursive: true, force: true });
});

describe('runStatus', () => {
  it('shows the site, the last deploy, the changes and the document counts', async () => {
    setTarget('production');

    const result = await runStatus();

    expect(result).toMatchObject({
      ok: true,
      projectId: 'fest-2027',
      url: 'https://fest-2027.web.app/',
      hoverboard: '4.0.0',
      schemaVersion: 3,
      features: ['speakers', 'schedule', 'feedback'],
      lastDeploy: { time: '2027-10-01T10:00:00Z', by: 'ada@example.com', message: 'Deploy' },
      changes: ['src/app.ts'],
    });
    expect(result['documents']).toMatchObject({
      speakers: 12,
      sessions: 30,
      'sessions/*/feedback': 4,
      'config/migrations': 1,
    });
    expect(result['documents']).not.toHaveProperty('blog');
    expect(mocks.firestore.collectionGroup).toHaveBeenCalledWith('feedback');
    expect(mocks.request).toHaveBeenCalledWith(
      'GET',
      'https://firebasehosting.googleapis.com/v1beta1/sites/fest-2027/releases?pageSize=1',
    );
    expect(output()).toContain('Documents in fest-2027:');
    expect(output()).toContain('Features off: blog');
  });

  it('counts the emulator documents when it runs', async () => {
    vi.stubEnv('FIRESTORE_EMULATOR_HOST', await listen());

    const result = await runStatus();

    expect(result['documents']).toMatchObject({ speakers: 12 });
    expect(output()).toContain('Documents in the emulator:');
  });

  it('lists the features the site hides for lack of content', async () => {
    vi.stubEnv('FIRESTORE_EMULATOR_HOST', await listen());
    write('packages/config/site.json', {
      firebase: { projectId: 'fest-2027' },
      features: { tickets: true },
      schedule: { published: false },
    });

    const result = await runStatus();

    expect(result['hidden']).toEqual(['blog', 'schedule', 'tickets']);
    expect(output()).toContain('On, but hidden from the site until they have content:');
    expect(output()).toContain('schedule (schedule.published is false)');
    expect(output()).toContain('tickets (no tickets)');
  });

  it('hides nothing when every feature has content', async () => {
    vi.stubEnv('FIRESTORE_EMULATOR_HOST', await listen());

    const result = await runStatus();

    expect(result['hidden']).toEqual([]);
    expect(output()).not.toContain('hidden from the site');
  });

  it("doesn't count without the emulator, or show a deploy it can't read", async () => {
    vi.stubEnv('FIRESTORE_EMULATOR_HOST', '127.0.0.1:1');
    mocks.request.mockRejectedValueOnce(new Error('Not logged in to Firebase.'));

    const result = await runStatus();

    expect(result).toMatchObject({ ok: true, lastDeployError: 'Not logged in to Firebase.' });
    expect(result).not.toHaveProperty('documents');
    expect(mocks.firestore.collection).not.toHaveBeenCalled();
    expect(output()).toContain("the emulator isn't running");
  });

  it('shows no changes without the release tag', async () => {
    setTarget('production');
    run('tag', '--delete', 'v4.0.0');
    mocks.request.mockResolvedValueOnce({});

    const result = await runStatus();

    expect(result).not.toHaveProperty('changes');
    expect(output()).toContain('Last deploy: none');
    expect(output()).toContain('without the v4.0.0 tag');
  });
});
