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
  const docs: Record<string, Record<string, unknown>[]> = {};
  const count = (name: string) => ({
    count: () => ({ get: async () => ({ data: () => ({ count: counts[name] ?? 0 }) }) }),
    get: async () => ({
      docs: (docs[name] ?? []).map((data, index) => ({ id: `${name}-${index}`, data: () => data })),
    }),
  });
  return {
    docs,
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
  for (const name of Object.keys(mocks.docs)) delete mocks.docs[name];
  vi.useRealTimers();
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

  describe('stages', () => {
    const site = (fields: Record<string, unknown> = {}) =>
      write('packages/config/site.json', {
        firebase: { projectId: 'fest-2027' },
        event: { startDate: '2027-10-13', endDate: '2027-10-14', timezone: 'Europe/Kyiv' },
        features: { tickets: true },
        ...fields,
      });
    // Only the clock, so the emulator check's socket still times out.
    const today = (time: string) => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(time));
    };

    beforeEach(async () => {
      vi.stubEnv('FIRESTORE_EMULATOR_HOST', await listen());
    });

    it('shows the stages, their states and what comes next', async () => {
      site({ callForPapers: { url: 'https://example.com/cfp', closes: '2027-03-01' } });
      mocks.docs['tickets'] = [{ available: true, soldOut: false, salesOpen: '2027-02-07' }];
      today('2027-01-15T12:00:00Z');

      const result = await runStatus();

      expect(result['stages']).toEqual({
        stages: ['announced', 'callForPapers', 'ticketSales'],
        ticketSales: 'notYetOnSale',
        next: { change: 'ticketsGoOnSale', date: '2027-02-07' },
      });
      expect(output()).toContain(
        'Stages: announced, call for papers (closes after 2027-03-01), ticket sales (not yet on sale)',
      );
      expect(output()).toContain('Next: tickets go on sale on 2027-02-07');
      expect(output()).toContain('The schedule shows once sessions have a day and times.');
    });

    it('shows the schedule once sessions have a day and times', async () => {
      site();
      mocks.docs['sessions'] = [
        { title: 'Keynote', day: '2027-10-13', startTime: '10:00', endTime: '11:00' },
      ];
      today('2027-09-01T12:00:00Z');

      const result = await runStatus();

      expect(result['stages']).toMatchObject({ stages: ['announced', 'schedule'] });
      expect(output()).toContain('Next: the event starts on 2027-10-13');
      expect(output()).not.toContain('The schedule shows once');
    });

    it('says the schedule waits for schedule.published', async () => {
      site({ schedule: { published: false } });
      mocks.docs['sessions'] = [
        { title: 'Keynote', day: '2027-10-13', startTime: '10:00', endTime: '11:00' },
      ];
      today('2027-09-01T12:00:00Z');

      await runStatus();

      expect(output()).toContain('Stages: announced\n');
      expect(output()).toContain('The schedule shows once schedule.published is true.');
    });

    it('is live in the event time zone, then ended', async () => {
      site();
      // 23:30 on the 12th in UTC is the 13th in Kyiv.
      today('2027-10-12T23:30:00Z');

      await runStatus();

      expect(output()).toContain('Stages: live');
      expect(output()).toContain('Next: the event ends after 2027-10-14');

      vi.mocked(console.log).mockClear();
      today('2027-10-20T12:00:00Z');
      const result = await runStatus();

      expect(result['stages']).toEqual({ stages: ['ended'] });
      expect(output()).not.toContain('Next:');
    });

    it('shows no stages without the event dates', async () => {
      const result = await runStatus();

      expect(result).not.toHaveProperty('stages');
      expect(output()).not.toContain('Stages:');
    });
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
