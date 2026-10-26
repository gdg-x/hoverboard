import { execFileSync } from 'child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { createConfiguredFakes, createFakeGoogle } from '@abraham/firebase-wif/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EXTRA_DEPLOY_ROLES,
  checkGitHubDeploys,
  githubRepoFromGit,
  runSetupGitHub,
  type Clients,
} from './setup-github.js';

const confirmMock = vi.hoisted(() => vi.fn());
vi.mock('../lib/prompt.js', () => ({ confirmChange: confirmMock }));

const PROJECT = 'demo-project';
const REPO = 'octo-org/site';
const FIREBASE_JSON = { hosting: {}, firestore: {}, storage: {}, functions: {} };

type Fakes = ReturnType<typeof createConfiguredFakes>;

let dir: string;
let logs: string[];

const repoWithOrigin = (url: string) => {
  const root = mkdtempSync(join(tmpdir(), 'hoverboard-git-'));
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['remote', 'add', 'origin', url], { cwd: root });
  writeFileSync(join(root, 'firebase.json'), JSON.stringify(FIREBASE_JSON));
  return root;
};

/** A project and repository that are fully set up, with Hoverboard's extra roles. */
const configured = (): Fakes => {
  const fakes = createConfiguredFakes({
    projectId: PROJECT,
    repo: REPO,
    firebaseJson: FIREBASE_JSON,
  });
  const member = `serviceAccount:${fakes.names.serviceAccount}`;
  fakes.google.state.projects[0]!.iamPolicy.bindings!.push(
    ...EXTRA_DEPLOY_ROLES.map((role) => ({ role, members: [member] })),
  );
  return fakes;
};

/** A repository with nothing set up, and a project with no APIs on. */
const fresh = () => {
  const { github } = createConfiguredFakes({ repo: REPO });
  const repo = github.state.repos[REPO]!;
  repo.variables = {};
  repo.environments = {};
  const google = createFakeGoogle({
    projects: [
      {
        projectId: PROJECT,
        projectNumber: '123',
        enabledServices: [],
        iamPolicy: { bindings: [] },
      },
    ],
  });
  return { google, github };
};

const clients = ({ google, github }: Pick<Fakes, 'google' | 'github'>): Clients => ({
  google: async () => google,
  github: async () => github,
  sleep: async () => {},
});

const writes = (google: Fakes['google']) =>
  google.calls.filter(
    ({ method, url }) => method !== 'GET' && !/:(testIamPermissions|getIamPolicy)$/.test(url),
  );

const membersOf = (google: Fakes['google'], projectId: string, role: string) =>
  google.state.projects
    .find((project) => project.projectId === projectId)
    ?.iamPolicy.bindings?.find((binding) => binding.role === role)?.members ?? [];

beforeEach(() => {
  dir = repoWithOrigin(`git@github.com:${REPO}.git`);
  vi.spyOn(process, 'cwd').mockReturnValue(dir);
  logs = [];
  vi.spyOn(console, 'log').mockImplementation((line: string) => logs.push(line));
  confirmMock.mockReset().mockResolvedValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  rmSync(dir, { recursive: true, force: true });
});

describe('runSetupGitHub', () => {
  it('sets up a new project and repository after asking', async () => {
    const fakes = fresh();

    const result = await runSetupGitHub({ project: PROJECT }, clients(fakes));

    expect(result.ok).toBe(true);
    expect(confirmMock).toHaveBeenCalledWith('\nApply these changes?', undefined);
    const repo = fakes.github.state.repos[REPO]!;
    const email = repo.variables?.['FIREBASE_WIF_SERVICE_ACCOUNT'];
    expect(email).toMatch(/@demo-project\.iam\.gserviceaccount\.com$/);
    expect(repo.variables?.['FIREBASE_WIF_PROVIDER']).toMatch(
      /^projects\/123\/locations\/global\/workloadIdentityPools\/github\/providers\//,
    );
    for (const role of [
      ...EXTRA_DEPLOY_ROLES,
      'roles/firebasehosting.admin',
      'roles/firebaserules.admin',
      'roles/cloudfunctions.admin',
    ]) {
      expect(membersOf(fakes.google, PROJECT, role)).toEqual([`serviceAccount:${email}`]);
    }
    expect(Object.keys(repo.environments ?? {})).toEqual(['production']);
    expect(logs).toContain('\nIAM changes can take a few minutes to take effect.');
  });

  it('changes nothing when everything is set up', async () => {
    const fakes = configured();

    const result = await runSetupGitHub({ project: PROJECT }, clients(fakes));

    expect(result).toEqual({ ok: true, changes: [] });
    expect(writes(fakes.google)).toEqual([]);
    expect(confirmMock).not.toHaveBeenCalled();
    expect(logs).toContain(`✔ ${REPO} can deploy to ${PROJECT}.`);
  });

  it('only reads in a dry run', async () => {
    const fakes = fresh();

    const result = await runSetupGitHub({ project: PROJECT, dryRun: true }, clients(fakes));

    expect(result.ok).toBe(true);
    expect(result['changes']).toEqual(expect.arrayContaining([expect.any(String)]));
    expect(writes(fakes.google)).toEqual([]);
    expect(fakes.github.state.repos[REPO]?.variables).toEqual({});
    expect(logs.filter((line) => line.startsWith('• Would ')).length).toBeGreaterThan(0);
    expect(confirmMock).not.toHaveBeenCalled();
  });

  it('changes nothing when declined', async () => {
    const fakes = fresh();
    confirmMock.mockResolvedValue(false);

    const result = await runSetupGitHub({ project: PROJECT }, clients(fakes));

    expect(result).toEqual({ ok: false, changes: [] });
    expect(writes(fakes.google)).toEqual([]);
    expect(logs).toContain('Aborted.');
  });

  it('passes --yes on to the confirmation', async () => {
    const fakes = fresh();

    await runSetupGitHub({ project: PROJECT, yes: true }, clients(fakes));

    expect(confirmMock).toHaveBeenCalledWith('\nApply these changes?', true);
  });

  it('adopts the setup of earlier versions', async () => {
    const legacyProvider =
      'projects/123/locations/global/workloadIdentityPools/github/providers/github';
    const legacyAccount = `github-deploy@${PROJECT}.iam.gserviceaccount.com`;
    const fakes = fresh();
    fakes.google.state.pools['projects/123/locations/global/workloadIdentityPools/github'] = {
      state: 'ACTIVE',
    };
    fakes.google.state.providers[legacyProvider] = {
      state: 'ACTIVE',
      attributeCondition: `assertion.repository == '${REPO}'`,
      oidc: { issuerUri: 'https://token.actions.githubusercontent.com' },
    };
    fakes.google.state.serviceAccounts[legacyAccount] = { projectId: PROJECT };
    fakes.github.state.repos[REPO]!.variables = {
      WIF_PROVIDER: legacyProvider,
      DEPLOY_SERVICE_ACCOUNT: legacyAccount,
    };

    const result = await runSetupGitHub({ project: PROJECT }, clients(fakes));

    expect(result.ok).toBe(true);
    expect(fakes.github.state.repos[REPO]?.variables).toMatchObject({
      FIREBASE_WIF_PROVIDER: legacyProvider,
      FIREBASE_WIF_SERVICE_ACCOUNT: legacyAccount,
    });
    expect(Object.keys(fakes.google.state.serviceAccounts)).toEqual([legacyAccount]);
    expect(membersOf(fakes.google, PROJECT, 'roles/datastore.viewer')).toEqual([
      `serviceAccount:${legacyAccount}`,
    ]);
  });

  it("lets a new edition's project reuse the deploy account", async () => {
    const fakes = configured();
    fakes.google.state.projects.push({
      projectId: 'fest-2028',
      projectNumber: '222',
      enabledServices: [],
      iamPolicy: { bindings: [] },
    });
    const pools = Object.keys(fakes.google.state.pools);

    const result = await runSetupGitHub({ project: 'fest-2028' }, clients(fakes));

    expect(result.ok).toBe(true);
    expect(Object.keys(fakes.google.state.pools)).toEqual(pools);
    for (const role of [...EXTRA_DEPLOY_ROLES, 'roles/firebasehosting.admin']) {
      expect(membersOf(fakes.google, 'fest-2028', role)).toEqual([
        `serviceAccount:${fakes.names.serviceAccount}`,
      ]);
    }
  });

  it('prints the GitHub changes to make by hand without GitHub credentials', async () => {
    const fakes = fresh();
    const { id, owner, default_branch } = fakes.github.state.repos[REPO]!;
    vi.stubGlobal('fetch', async () => Response.json({ id, owner, default_branch }));

    const result = await runSetupGitHub(
      { project: PROJECT },
      { ...clients(fakes), github: async () => false },
    );

    expect(result.ok).toBe(true);
    expect(logs).toContainEqual(
      expect.stringMatching(/^! Do by hand: set repo variable FIREBASE_WIF_PROVIDER to projects\//),
    );
  });

  it('stops before changing anything when the account is missing permissions', async () => {
    const fakes = fresh();
    fakes.google.state.projects[0]!.grantedPermissions = [];

    const result = await runSetupGitHub({ project: PROJECT }, clients(fakes));

    expect(result).toEqual({ ok: false });
    expect(writes(fakes.google)).toEqual([]);
    expect(logs).toContainEqual(expect.stringContaining('iam.serviceAccounts.create'));
    expect(logs).toContain('  Ask a project owner to run ./hb setup-github.');
  });
});

describe('githubRepoFromGit', () => {
  it.each([
    'git@github.com:owner/site.git',
    'https://github.com/owner/site.git',
    'https://github.com/owner/site',
  ])('reads owner/name from %s', (url) => {
    const root = repoWithOrigin(url);
    expect(githubRepoFromGit(root)).toBe('owner/site');
    rmSync(root, { recursive: true, force: true });
  });

  it('returns undefined for other hosts', () => {
    const root = repoWithOrigin('https://gitlab.com/owner/site.git');
    expect(githubRepoFromGit(root)).toBeUndefined();
    rmSync(root, { recursive: true, force: true });
  });
});

describe('checkGitHubDeploys', () => {
  it('passes when everything is set up', async () => {
    expect(await checkGitHubDeploys(dir, PROJECT, clients(configured()))).toEqual({
      name: 'GitHub deploys',
      ok: true,
      message: `${REPO} can deploy to ${PROJECT} without a key.`,
    });
  });

  it('warns with what is missing', async () => {
    const result = await checkGitHubDeploys(dir, PROJECT, clients(fresh()));

    expect(result).toMatchObject({ ok: true, warning: true });
    expect(result.message).toContain(`Run \`./hb setup-github\` so ${REPO} can deploy`);
    expect(result.message).toContain('FIREBASE_WIF_PROVIDER');
  });

  it('warns about deploy workflows without an environment', async () => {
    mkdirSync(join(dir, '.github/workflows'), { recursive: true });
    writeFileSync(
      join(dir, '.github/workflows/deploy.yaml'),
      [
        'on: push',
        'permissions:',
        '  id-token: write',
        'jobs:',
        '  deploy:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: abraham/firebase-wif@v0.2.1',
        '      - run: npx firebase deploy',
      ].join('\n'),
    );

    const result = await checkGitHubDeploys(dir, PROJECT, clients(configured()));

    expect(result).toMatchObject({ ok: true, warning: true });
    expect(result.message).toContain('environment: production');
  });

  it("passes with Hoverboard's deploy workflows", async () => {
    cpSync(
      join(import.meta.dirname, '../../../../.github/workflows'),
      join(dir, '.github/workflows'),
      {
        recursive: true,
      },
    );
    const fakes = configured();
    fakes.github.state.repos[REPO]!.environments!['preview'] = {
      deployment_branch_policy: null,
      branchPolicies: [],
    };

    expect(await checkGitHubDeploys(dir, PROJECT, clients(fakes))).toEqual({
      name: 'GitHub deploys',
      ok: true,
      message: `${REPO} can deploy to ${PROJECT} without a key.`,
    });
  });

  it('warns when Google Cloud cannot be read', async () => {
    const result = await checkGitHubDeploys(dir, PROJECT, {
      ...clients(configured()),
      google: () => Promise.reject(new Error('Not logged in to Firebase.')),
    });

    expect(result).toMatchObject({ ok: true, warning: true });
    expect(result.message).toContain('Not logged in to Firebase.');
  });

  it('skips repositories that are not on GitHub', async () => {
    const root = repoWithOrigin('https://gitlab.com/a/b.git');
    const result = await checkGitHubDeploys(root, PROJECT);
    rmSync(root, { recursive: true, force: true });

    expect(result.message).toBe('Skipped, the origin remote is not on GitHub.');
  });
});
