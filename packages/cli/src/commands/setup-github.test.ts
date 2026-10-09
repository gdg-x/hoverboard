import { execFileSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import type { GoogleCloud, HttpMethod } from '../lib/google-cloud.js';
import {
  DEPLOY_ROLES,
  REQUIRED_APIS,
  REQUIRED_PERMISSIONS,
  checkGitHubDeploys,
  githubRepoFromGit,
  setupGitHub,
} from './setup-github.js';
import type { GitHubVariables } from './setup-github.js';

const PROJECT = 'demo-project';
const REPO = 'owner/site';
const EMAIL = `github-deploy@${PROJECT}.iam.gserviceaccount.com`;
const POOL = `https://iam.googleapis.com/v1/projects/${PROJECT}/locations/global/workloadIdentityPools/github`;
const PROVIDER = `${POOL}/providers/github`;
const ACCOUNT = `https://iam.googleapis.com/v1/projects/${PROJECT}/serviceAccounts/${EMAIL}`;
const PRINCIPAL = `principalSet://iam.googleapis.com/projects/123/locations/global/workloadIdentityPools/github/attribute.repository/${REPO}`;
const PROVIDER_NAME = 'projects/123/locations/global/workloadIdentityPools/github/providers/github';

interface Policy {
  bindings?: { role: string; members?: string[] }[];
}

interface FakeState {
  permissions: string[];
  enabledApis: Set<string>;
  account: boolean;
  projectPolicy: Policy;
  accountPolicy: Policy;
  pool?: { state: string };
  provider?: { state: string; attributeCondition?: string };
}

const notFound = () => Object.assign(new Error('Not Found'), { status: 404 });

/** An in-memory Google Cloud that records every request. */
const fakeCloud = (overrides: Partial<FakeState> = {}) => {
  const state: FakeState = {
    permissions: [...REQUIRED_PERMISSIONS],
    enabledApis: new Set(REQUIRED_APIS),
    account: false,
    projectPolicy: { bindings: [] },
    accountPolicy: {},
    ...overrides,
  };
  const requests: string[] = [];
  const done = { name: 'operations/1', done: true };

  const cloud: GoogleCloud = {
    async request<T>(method: HttpMethod, url: string, body?: unknown): Promise<T> {
      requests.push(`${method} ${url}`);
      const path = url.split('?')[0] ?? '';
      const respond = (value: unknown) => value as T;
      const input = body as { policy?: Policy } | undefined;

      if (path.endsWith(':testIamPermissions')) return respond({ permissions: state.permissions });
      if (path.endsWith(`/projects/${PROJECT}`)) return respond({ projectNumber: '123' });
      if (path.includes('/services/')) {
        const api = path.split('/services/')[1]?.replace(':enable', '') ?? '';
        if (method === 'POST') state.enabledApis.add(api);
        return respond(
          method === 'POST' ? done : { state: state.enabledApis.has(api) ? 'ENABLED' : 'DISABLED' },
        );
      }
      if (path.endsWith(':getIamPolicy')) {
        return respond(
          structuredClone(path.startsWith(ACCOUNT) ? state.accountPolicy : state.projectPolicy),
        );
      }
      if (path.endsWith(':setIamPolicy')) {
        if (path.startsWith(ACCOUNT)) state.accountPolicy = input?.policy ?? {};
        else state.projectPolicy = input?.policy ?? {};
        return respond({});
      }
      if (path === ACCOUNT) {
        if (!state.account) throw notFound();
        return respond({ email: EMAIL });
      }
      if (path.endsWith('/serviceAccounts') && method === 'POST') {
        state.account = true;
        return respond({ email: EMAIL });
      }
      if (path === `${POOL}:undelete`) {
        state.pool = { state: 'ACTIVE' };
        return respond(done);
      }
      if (path === POOL) {
        if (!state.pool) throw notFound();
        return respond(state.pool);
      }
      if (path.endsWith('/workloadIdentityPools') && method === 'POST') {
        state.pool = { state: 'ACTIVE' };
        return respond(done);
      }
      if (path === PROVIDER && method === 'PATCH') {
        state.provider = {
          state: 'ACTIVE',
          attributeCondition: (body as { attributeCondition: string }).attributeCondition,
        };
        return respond(done);
      }
      if (path === PROVIDER) {
        if (!state.provider) throw notFound();
        return respond(state.provider);
      }
      if (path.endsWith('/providers') && method === 'POST') {
        state.provider = {
          state: 'ACTIVE',
          attributeCondition: (body as { attributeCondition: string }).attributeCondition,
        };
        return respond(done);
      }
      throw new Error(`Unexpected request: ${method} ${url}`);
    },
  };

  return { cloud, state, requests };
};

const fakeGitHub = (works = true, initial: Record<string, string> = {}) => {
  const variables: Record<string, string> = { ...initial };
  const github: GitHubVariables = {
    get(repo, name) {
      return variables[`${repo}:${name}`];
    },
    set(repo, name, value) {
      if (works) variables[`${repo}:${name}`] = value;
      return works;
    },
  };
  return { github, variables };
};

const run = async (cloud: GoogleCloud, github: GitHubVariables, dryRun = false) => {
  const logs: string[] = [];
  const result = await setupGitHub({
    cloud,
    github,
    projectId: PROJECT,
    repo: REPO,
    dryRun,
    log: (message) => logs.push(message),
    sleep: async () => {},
  });
  return { ...result, logs };
};

const membersOf = (policy: Policy, role: string) =>
  policy.bindings?.find((binding) => binding.role === role)?.members ?? [];

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const repoWithOrigin = (url: string) => {
  const dir = mkdtempSync(join(tmpdir(), 'hoverboard-git-'));
  dirs.push(dir);
  execFileSync('git', ['init', '-q'], { cwd: dir });
  execFileSync('git', ['remote', 'add', 'origin', url], { cwd: dir });
  return dir;
};

describe('setupGitHub', () => {
  it('creates everything in a new project and sets the GitHub variables', async () => {
    const { cloud, state } = fakeCloud({ enabledApis: new Set() });
    const { github, variables } = fakeGitHub();

    const { ok } = await run(cloud, github);

    expect(ok).toBe(true);
    expect([...state.enabledApis].sort()).toEqual([...REQUIRED_APIS].sort());
    expect(state.account).toBe(true);
    for (const role of DEPLOY_ROLES) {
      expect(membersOf(state.projectPolicy, role)).toEqual([`serviceAccount:${EMAIL}`]);
    }
    expect(state.pool?.state).toBe('ACTIVE');
    expect(state.provider?.attributeCondition).toBe(`assertion.repository == '${REPO}'`);
    expect(membersOf(state.accountPolicy, 'roles/iam.workloadIdentityUser')).toEqual([PRINCIPAL]);
    expect(variables).toEqual({
      [`${REPO}:WIF_PROVIDER`]: PROVIDER_NAME,
      [`${REPO}:DEPLOY_SERVICE_ACCOUNT`]: EMAIL,
    });
  });

  it('changes nothing when everything is already set up', async () => {
    const { cloud, requests } = fakeCloud({
      account: true,
      projectPolicy: {
        bindings: DEPLOY_ROLES.map((role) => ({ role, members: [`serviceAccount:${EMAIL}`] })),
      },
      accountPolicy: {
        bindings: [{ role: 'roles/iam.workloadIdentityUser', members: [PRINCIPAL] }],
      },
      pool: { state: 'ACTIVE' },
      provider: { state: 'ACTIVE', attributeCondition: `assertion.repository == '${REPO}'` },
    });
    const { github } = fakeGitHub(true, {
      [`${REPO}:WIF_PROVIDER`]: PROVIDER_NAME,
      [`${REPO}:DEPLOY_SERVICE_ACCOUNT`]: EMAIL,
    });

    const { ok, changes, logs } = await run(cloud, github);

    expect(ok).toBe(true);
    expect(changes).toEqual([]);
    expect(
      requests.filter((request) => /setIamPolicy|PATCH|:enable|undelete/.test(request)),
    ).toEqual([]);
    expect(
      requests.filter(
        (request) =>
          request.startsWith('POST') && /serviceAccounts$|Pools\?|providers\?/.test(request),
      ),
    ).toEqual([]);
    expect(logs.some((line) => line.startsWith('•'))).toBe(false);
  });

  it('keeps existing members and adds only missing roles', async () => {
    const { cloud, state } = fakeCloud({
      account: true,
      projectPolicy: {
        bindings: [
          {
            role: 'roles/firebase.admin',
            members: ['user:owner@example.com', `serviceAccount:${EMAIL}`],
          },
        ],
      },
    });
    const { github } = fakeGitHub();

    await run(cloud, github);

    expect(membersOf(state.projectPolicy, 'roles/firebase.admin')).toEqual([
      'user:owner@example.com',
      `serviceAccount:${EMAIL}`,
    ]);
    expect(membersOf(state.projectPolicy, 'roles/run.admin')).toEqual([`serviceAccount:${EMAIL}`]);
  });

  it('limits an existing provider to the repository', async () => {
    const { cloud, state } = fakeCloud({
      account: true,
      pool: { state: 'ACTIVE' },
      provider: { state: 'ACTIVE' },
    });
    const { github } = fakeGitHub();

    await run(cloud, github);

    expect(state.provider?.attributeCondition).toBe(`assertion.repository == '${REPO}'`);
  });

  it('restores a deleted pool', async () => {
    const { cloud, state } = fakeCloud({ pool: { state: 'DELETED' } });
    const { github } = fakeGitHub();

    await run(cloud, github);

    expect(state.pool?.state).toBe('ACTIVE');
  });

  it('only reads in a dry run', async () => {
    const { cloud, requests } = fakeCloud();
    const { github, variables } = fakeGitHub();

    const { ok, changes, logs } = await run(cloud, github, true);

    expect(ok).toBe(true);
    const writes = requests.filter(
      (request) => !request.startsWith('GET') && !/testIamPermissions|getIamPolicy/.test(request),
    );
    expect(writes).toEqual([]);
    expect(variables).toEqual({});
    expect(changes).toContain(`create the service account ${EMAIL}`);
    expect(logs).toContain(`• Would create the service account ${EMAIL}`);
    expect(logs).toContain(`• Would let ${REPO} act as ${EMAIL}`);
  });

  it('reports an outdated GitHub variable in a dry run', async () => {
    const { cloud } = fakeCloud();
    const { github } = fakeGitHub(true, {
      [`${REPO}:WIF_PROVIDER`]:
        'projects/1/locations/global/workloadIdentityPools/old/providers/old',
      [`${REPO}:DEPLOY_SERVICE_ACCOUNT`]: EMAIL,
    });

    const { changes } = await run(cloud, github, true);

    expect(changes).toContain(
      `set the ${REPO} repository variable WIF_PROVIDER to ${PROVIDER_NAME}`,
    );
    expect(changes.some((entry) => entry.includes('DEPLOY_SERVICE_ACCOUNT'))).toBe(false);
  });

  it('keeps checking in a dry run when the account cannot make changes', async () => {
    const { cloud } = fakeCloud({ permissions: [] });
    const { github } = fakeGitHub();

    const { ok, changes, logs } = await run(cloud, github, true);

    expect(ok).toBe(true);
    expect(logs[0]).toContain('iam.serviceAccounts.create');
    expect(changes).toContain(`create the service account ${EMAIL}`);
  });

  it('stops a dry run after the APIs when some are disabled', async () => {
    const { cloud, requests } = fakeCloud({ enabledApis: new Set() });
    const { github } = fakeGitHub();

    const { ok, logs } = await run(cloud, github, true);

    expect(ok).toBe(true);
    expect(logs).toContain('• Would enable iam.googleapis.com');
    expect(requests.some((request) => request.includes('serviceAccounts'))).toBe(false);
  });

  it('stops when the account is missing permissions', async () => {
    const { cloud, requests } = fakeCloud({ permissions: [] });
    const { github } = fakeGitHub();

    const { ok, logs } = await run(cloud, github);

    expect(ok).toBe(false);
    expect(logs[0]).toContain('iam.serviceAccounts.create');
    expect(requests).toHaveLength(1);
  });

  it('prints the variables when gh cannot set them', async () => {
    const { cloud } = fakeCloud();
    const { github } = fakeGitHub(false);

    const { logs } = await run(cloud, github);

    expect(logs).toContain(
      `! Set the ${REPO} repository variable DEPLOY_SERVICE_ACCOUNT to ${EMAIL} in the GitHub settings.`,
    );
  });
});

describe('githubRepoFromGit', () => {
  it.each([
    'git@github.com:owner/site.git',
    'https://github.com/owner/site.git',
    'https://github.com/owner/site',
  ])('reads owner/name from %s', (url) => {
    expect(githubRepoFromGit(repoWithOrigin(url))).toBe('owner/site');
  });

  it('returns undefined for other hosts', () => {
    expect(githubRepoFromGit(repoWithOrigin('https://gitlab.com/owner/site.git'))).toBeUndefined();
  });
});

describe('checkGitHubDeploys', () => {
  const check = (cloud: GoogleCloud, github: GitHubVariables) =>
    checkGitHubDeploys(repoWithOrigin(`git@github.com:${REPO}.git`), PROJECT, {
      createCloud: async () => cloud,
      github,
    });

  it('passes when everything is set up', async () => {
    const { cloud } = fakeCloud({
      account: true,
      projectPolicy: {
        bindings: DEPLOY_ROLES.map((role) => ({ role, members: [`serviceAccount:${EMAIL}`] })),
      },
      accountPolicy: {
        bindings: [{ role: 'roles/iam.workloadIdentityUser', members: [PRINCIPAL] }],
      },
      pool: { state: 'ACTIVE' },
      provider: { state: 'ACTIVE', attributeCondition: `assertion.repository == '${REPO}'` },
    });
    const { github } = fakeGitHub(true, {
      [`${REPO}:WIF_PROVIDER`]: PROVIDER_NAME,
      [`${REPO}:DEPLOY_SERVICE_ACCOUNT`]: EMAIL,
    });

    expect(await check(cloud, github)).toEqual({
      name: 'GitHub deploys',
      ok: true,
      message: `${REPO} can deploy to ${PROJECT} without a key.`,
    });
  });

  it('warns with what is missing', async () => {
    const { cloud } = fakeCloud();
    const { github } = fakeGitHub();

    const result = await check(cloud, github);

    expect(result).toMatchObject({ ok: true, warning: true });
    expect(result.message).toContain('./hb setup-github');
    expect(result.message).toContain(`create the service account ${EMAIL}`);
  });

  it('warns when Google Cloud cannot be read', async () => {
    const cloud: GoogleCloud = {
      request: () => Promise.reject(new Error('Not logged in to Firebase.')),
    };

    const result = await check(cloud, fakeGitHub().github);

    expect(result).toMatchObject({ ok: true, warning: true });
    expect(result.message).toContain('Not logged in to Firebase.');
  });

  it('skips repositories that are not on GitHub', async () => {
    const result = await checkGitHubDeploys(repoWithOrigin('https://gitlab.com/a/b.git'), PROJECT);

    expect(result.message).toBe('Skipped, the origin remote is not on GitHub.');
  });
});
