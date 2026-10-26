import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteAllUsers } from '../lib/auth-users.js';
import { isBillingEnabled } from '../lib/billing.js';
import { type ExportDocument, inPath, readExport, writeExport } from '../lib/data-format.js';
import {
  createDatabase,
  createSchedule,
  databaseLocation,
  deleteSchedule,
  exportUsers,
  importUsers,
  listSchedules,
  pitrEnabled,
  setPitr,
} from '../lib/firebase-backups.js';
import { runCommand } from '../lib/spawn.js';
import { setTarget } from '../lib/target.js';
import {
  runEditionFeedback,
  runEditionList,
  runEditionNew,
  runEditionRebuild,
  runEditionSwitch,
  suggestProjectId,
} from './edition.js';
import { firebaseProjects } from './init/firebase-projects.js';

vi.mock('../lib/spawn.js', () => ({ runCommand: vi.fn() }));
vi.mock('../lib/firebase-cli.js', () => ({ resolveFirebaseBin: () => 'firebase' }));
vi.mock('../lib/billing.js', () => ({ isBillingEnabled: vi.fn() }));
vi.mock('../lib/auth-users.js', () => ({ deleteAllUsers: vi.fn(async () => 2) }));
vi.mock('../lib/google-cloud.js', () => ({ useFirebaseLoginCredentials: vi.fn() }));
vi.mock('../lib/deployed-functions.js', () => ({
  listDeployedFunctions: vi.fn(async () => [
    { id: 'sendNotification', region: 'us', platform: 'gcfv2' },
  ]),
}));
vi.mock('./init/firebase-projects.js', () => ({ firebaseProjects: vi.fn() }));
vi.mock('../lib/firebase-backups.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/firebase-backups.js')>()),
  exportUsers: vi.fn(),
  importUsers: vi.fn(),
  databaseLocation: vi.fn(),
  createDatabase: vi.fn(),
  listSchedules: vi.fn(async () => []),
  createSchedule: vi.fn(),
  deleteSchedule: vi.fn(),
  pitrEnabled: vi.fn(async () => false),
  setPitr: vi.fn(),
}));
const { feedbackStore } = vi.hoisted(() => ({
  feedbackStore: { sessions: [] as { id: string; title: string; feedback: object[] }[] },
}));
vi.mock('../lib/firestore.js', () => ({
  firestore: {
    collection: () => ({
      get: async () => ({
        docs: feedbackStore.sessions.map(({ id, title, feedback }) => ({
          id,
          get: () => title,
          ref: {
            collection: () => ({
              get: async () => ({ docs: feedback.map((data) => ({ data: () => data })) }),
            }),
          },
        })),
      }),
    }),
  },
}));

const run = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
const json = (data: unknown) => `${JSON.stringify(data, null, 2)}\n`;
const readJson = (path: string) =>
  JSON.parse(readFileSync(join(repo, path), 'utf8')) as Record<string, unknown>;
const write = (files: Record<string, string>) => {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(repo, path)), { recursive: true });
    writeFileSync(join(repo, path), content);
  }
};
const commitAll = (message: string) => {
  run(repo, 'add', '--all');
  run(repo, 'commit', '--quiet', '-m', message);
};

const SITE = {
  firebase: { projectId: 'fest' },
  url: 'https://devfest.example/',
  event: { startDate: '2027-10-15', endDate: '2027-10-16' },
  schedule: { published: true, tracks: [{ id: 'main', title: 'Main', days: ['2027-10-15'] }] },
  features: { blog: true, map: true },
};

/** What the current edition has in Firestore. */
const CURRENT: ExportDocument[] = [
  { path: 'blog/hello', data: { title: 'Hello' } },
  { path: 'profiles/u1', data: { name: 'Ada' } },
  { path: 'speakers/ada', data: { name: 'Ada', photoUrl: 'https://photos.example/ada.jpg' } },
  { path: 'speakers/idle', data: { name: 'Idle' } },
  { path: 'sessions/101', data: { title: 'Engines', tags: [], speakers: ['ada'] } },
  { path: 'previousSpeakers/grace', data: { id: 'grace', sessions: { '2026': [] } } },
];

let repo: string;
let imports: { project: string | undefined; documents: ExportDocument[] }[];
let builds: { cwd: string; env: Record<string, string | undefined> | undefined; site: unknown }[];
const commands = () =>
  vi
    .mocked(runCommand)
    .mock.calls.map(([command, args, , env]) =>
      [
        command === process.execPath ? 'node' : command,
        ...args,
        ...(env?.['GCLOUD_PROJECT'] ? [`@${env['GCLOUD_PROJECT']}`] : []),
      ].join(' '),
    );
const projects = {
  list: vi.fn(),
  create: vi.fn(),
  webApps: vi.fn(),
  createWebApp: vi.fn(),
  signedIn: vi.fn(),
};

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'hoverboard-edition-'));
  vi.stubEnv('GIT_CONFIG_GLOBAL', '/dev/null');
  vi.stubEnv('GIT_CONFIG_NOSYSTEM', '1');
  vi.stubEnv('GIT_AUTHOR_NAME', 'Test');
  vi.stubEnv('GIT_AUTHOR_EMAIL', 'test@example.com');
  vi.stubEnv('GIT_COMMITTER_NAME', 'Test');
  vi.stubEnv('GIT_COMMITTER_EMAIL', 'test@example.com');
  delete process.env['GCLOUD_PROJECT'];
  run(repo, 'init', '--quiet', '--initial-branch=main');
  write({
    'package.json': json({ version: '4.0.0' }),
    'packages/config/site.json': json(SITE),
    'packages/config/content/resources.json': json({
      heroDescriptions: { home: 'DevFest 2027', blog: 'News' },
      attendingPage: {
        description: 'Come',
        doors: [{ day: '2027-10-15', open: '08:00', close: '18:00' }],
      },
    }),
  });
  commitAll('feat: the site');
  vi.spyOn(process, 'cwd').mockReturnValue(repo);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  imports = [];
  builds = [];
  vi.mocked(runCommand).mockImplementation((command, args, cwd, env) => {
    if (args[0] === 'hb' && args[1] === 'data' && args[2] === 'export') {
      const project = env?.['GCLOUD_PROJECT'];
      const collections = args.flatMap((arg, index) =>
        args[index - 1] === '--collection' ? [arg] : [],
      );
      const documents = (project === 'fest' ? CURRENT : []).filter(({ path }) =>
        collections.some((collection) => inPath(path, collection)),
      );
      writeExport(args[3]!, documents, {
        hoverboard: '4.0.0',
        projectId: project ?? '',
        createdAt: '2027-10-17T00:00:00.000Z',
        command: 'hb data export',
      });
    }
    if (args[0] === 'hb' && args[1] === 'data' && args[2] === 'import') {
      imports.push({ project: env?.['GCLOUD_PROJECT'], documents: readExport(args[3]!).documents });
    }
    if (command === 'npm' && args[1] === 'build') {
      builds.push({
        cwd,
        env,
        site: JSON.parse(readFileSync(join(cwd, 'packages/config/site.json'), 'utf8')),
      });
    }
    return 0;
  });
  vi.mocked(firebaseProjects).mockReturnValue(projects);
  projects.list.mockReturnValue([{ projectId: 'fest' }]);
  projects.webApps.mockReturnValue([]);
  vi.mocked(isBillingEnabled).mockResolvedValue(true);
  vi.mocked(databaseLocation).mockImplementation(async (_root, projectId) =>
    projectId === 'fest' ? 'eur3' : undefined,
  );
  vi.mocked(exportUsers).mockImplementation(async (_root, projectId, file) =>
    writeFileSync(
      file,
      JSON.stringify({
        users:
          projectId === 'fest'
            ? [{ localId: 'u1' }, { localId: 'u2' }, { localId: 'pw', passwordHash: 'x' }]
            : [{ localId: 'u1' }],
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  setTarget('emulator');
  rmSync(repo, { recursive: true, force: true });
});

describe('suggestProjectId', () => {
  it('adds the year to the project, or replaces it', () => {
    expect(suggestProjectId('devfest-ua', 2028)).toBe('devfest-ua-2028');
    expect(suggestProjectId('devfest-ua-2027', 2028)).toBe('devfest-ua-2028');
  });
});

describe('runEditionNew', () => {
  it('shows the plan without changing anything in a dry run', async () => {
    expect(await runEditionNew({ project: 'fest-2028', dryRun: true })).toMatchObject({
      from: 'fest',
      to: 'fest-2028',
      year: 2027,
    });
    expect(runCommand).not.toHaveBeenCalled();
    expect(projects.create).not.toHaveBeenCalled();
  });

  it('creates the next edition and deploys it', async () => {
    const result = await runEditionNew({ project: 'fest-2028', yes: true });

    expect(result).toMatchObject({ ok: true, to: 'fest-2028', users: 1 });
    expect(projects.create).toHaveBeenCalledWith('fest-2028', 'fest-2028');
    expect(projects.createWebApp).toHaveBeenCalledWith('fest-2028', 'Hoverboard');
    expect(createDatabase).toHaveBeenCalledWith(repo, 'fest-2028', 'eur3');
    expect(run(repo, 'tag', '--list')).toBe('edition/2027');
    expect(commands()).toEqual([
      'node hb data check --production',
      'node hb backup create --production',
      'node hb setup-github --project fest-2028 --yes',
      expect.stringMatching(
        /^node hb data export .* --collection previousSpeakers .* --production @fest$/,
      ),
      expect.stringMatching(/^node hb data import .* --production --yes @fest-2028$/),
      expect.stringContaining('prettier'),
      'node hb deploy --yes',
    ]);
    expect(run(repo, 'log', '-1', '--format=%s')).toBe(
      'chore: start the 2028 edition in fest-2028',
    );
  });

  it('copies what carries over to the next edition', async () => {
    await runEditionNew({ project: 'fest-2028', yes: true });

    const [copy] = imports;
    expect(copy!.project).toBe('fest-2028');
    expect(copy!.documents.map(({ path }) => path).sort()).toEqual([
      'blog/hello',
      'previousSpeakers/ada',
      'previousSpeakers/grace',
      'profiles/u1',
    ]);
    expect(copy!.documents.find(({ path }) => path === 'previousSpeakers/ada')!.data).toMatchObject(
      {
        sessions: { '2027': [{ title: 'Engines', tags: [] }] },
      },
    );
    expect(importUsers).toHaveBeenCalledTimes(1);
  });

  it("points the site's config at the next edition", async () => {
    await runEditionNew({ project: 'fest-2028', yes: true });

    expect(readJson('packages/config/site.json')).toMatchObject({
      firebase: { projectId: 'fest-2028' },
      url: 'https://devfest.example/',
      schedule: { tracks: [{ id: 'main', title: 'Main' }] },
    });
    expect(readJson('packages/config/content/resources.json')['attendingPage']).toEqual({
      description: 'Come',
    });
    expect(vi.mocked(console.log).mock.calls.flat().join('\n')).toContain(
      'heroDescriptions mention 2027: home',
    );
  });

  it('stops before changing anything else without the Blaze plan', async () => {
    vi.mocked(isBillingEnabled).mockResolvedValue(false);

    expect(await runEditionNew({ project: 'fest-2028', yes: true })).toBe(false);

    expect(commands()).toEqual(['node hb data check --production']);
    expect(run(repo, 'tag', '--list')).toBe('');
  });

  it('refuses the current project, and a year already archived', async () => {
    await expect(runEditionNew({ project: 'fest', yes: true })).rejects.toThrow(
      "is the current edition's project",
    );
    write({
      'packages/config/editions.json': json([
        { year: 2027, tag: 'edition/2027', projectId: 'old', url: 'https://x/' },
      ]),
    });
    commitAll('chore: archive');
    await expect(runEditionNew({ project: 'fest-2028', yes: true })).rejects.toThrow(
      'already archived',
    );
  });
});

describe('runEditionSwitch and the archived editions', () => {
  /** The state after `hb edition new`: a tag of the old edition, and site.json on the new one. */
  const afterNew = () => {
    run(repo, 'tag', 'edition/2027');
    write({ 'packages/config/site.json': json({ ...SITE, firebase: { projectId: 'fest-2028' } }) });
    commitAll('chore: start the 2028 edition in fest-2028');
  };

  it('archives the previous edition, and records it', async () => {
    afterNew();

    const result = await runEditionSwitch({
      archiveUrl: 'https://2027.devfest.example/',
      yes: true,
    });

    expect(result).toMatchObject({ ok: true, to: 'fest-2028', users: 1, deletedUsers: 2 });
    expect(imports).toEqual([
      { project: 'fest-2028', documents: [{ path: 'profiles/u1', data: { name: 'Ada' } }] },
    ]);
    expect(commands()).toEqual(
      expect.arrayContaining([
        'node hb backup create --production @fest',
        'firebase functions:delete sendNotification --force --project fest',
        'firebase deploy --only firestore --config .firebase/archive.firebase.json --project fest --non-interactive',
        'firebase firestore:delete blog --recursive --force --project fest',
        'firebase firestore:delete config/notifications --force --project fest',
        'npm ci',
        'npm run build @fest',
        'firebase deploy --only hosting --project fest --non-interactive',
      ]),
    );
    expect(deleteAllUsers).toHaveBeenCalledWith(repo, 'fest');
    expect(builds[0]!.site).toMatchObject({
      url: 'https://2027.devfest.example/',
      archive: { year: 2027, current: 'https://devfest.example/' },
      firebase: { projectId: 'fest' },
      features: { blog: false, functions: false, map: true },
    });
    expect(existsSync(builds[0]!.cwd)).toBe(false);
    expect(readJson('packages/config/editions.json')).toEqual([
      { year: 2027, tag: 'edition/2027', projectId: 'fest', url: 'https://2027.devfest.example/' },
    ]);
    expect(run(repo, 'log', '-1', '--format=%s')).toBe('chore: archive the 2027 edition');
  });

  it('moves the backups to the new edition', async () => {
    afterNew();
    vi.mocked(listSchedules).mockImplementation(async (_root, projectId) =>
      projectId === 'fest' ? [{ name: 's1', retention: '604800s', dailyRecurrence: {} }] : [],
    );
    vi.mocked(pitrEnabled).mockImplementation(async (_root, projectId) => projectId === 'fest');

    await runEditionSwitch({ archiveUrl: 'https://2027.devfest.example/', yes: true });

    expect(createSchedule).toHaveBeenCalledWith(repo, 'fest-2028', { retentionDays: 7 });
    expect(deleteSchedule).toHaveBeenCalledWith(repo, 'fest', 's1');
    expect(setPitr).toHaveBeenCalledWith(repo, 'fest-2028', true);
    expect(setPitr).toHaveBeenCalledWith(repo, 'fest', false);
  });

  it('lists the archived edition, and can rebuild it', async () => {
    afterNew();
    await runEditionSwitch({ archiveUrl: 'https://2027.devfest.example/', yes: true });
    vi.mocked(runCommand).mockClear();
    builds = [];

    expect(runEditionList()).toMatchObject({
      current: { year: 2027, projectId: 'fest-2028' },
      editions: [{ year: 2027, hoverboard: '4.0.0' }],
    });
    expect(await runEditionRebuild('2027', { yes: true })).toMatchObject({ ok: true });
    expect(builds).toHaveLength(1);
    expect(builds[0]!.env).toEqual({ FIRESTORE_TARGET: 'production', GCLOUD_PROJECT: 'fest' });
  });

  it('needs an edition to archive', async () => {
    await expect(runEditionSwitch({ yes: true })).rejects.toThrow('No edition to archive');
    run(repo, 'tag', 'edition/2027');
    await expect(runEditionSwitch({ yes: true })).rejects.toThrow('still names fest');
  });

  it("refuses to rebuild an edition that isn't archived", async () => {
    await expect(runEditionRebuild('2020')).rejects.toThrow('has no 2020 edition');
  });
});

describe('runEditionFeedback', () => {
  it('writes the feedback of each session, without user IDs', async () => {
    feedbackStore.sessions = [
      {
        id: '101',
        title: 'Engines',
        feedback: [
          { contentRating: 5, styleRating: 4, comment: 'Great, thanks', userId: 'u1' },
          { contentRating: 4, styleRating: 4, comment: '=cmd', userId: 'u2' },
        ],
      },
      { id: '102', title: 'Quiet', feedback: [] },
    ];
    const folder = join(repo, 'out');

    expect(await runEditionFeedback(undefined, { folder })).toMatchObject({
      sessions: 1,
      responses: 2,
    });

    expect(readFileSync(join(folder, '101.csv'), 'utf8')).toBe(
      'id,contentRating,styleRating,comment\r\n1,5,4,"Great, thanks"\r\n2,4,4,\'=cmd\r\n',
    );
    expect(readFileSync(join(folder, 'sessions.csv'), 'utf8')).toBe(
      'id,title,responses,contentRating,styleRating\r\n101,Engines,2,4.5,4\r\n',
    );
    expect(existsSync(join(folder, '102.csv'))).toBe(false);
  });
});
