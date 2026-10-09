import { spawnSync } from 'child_process';
import { createGoogleCloud } from '../lib/google-cloud.js';
import type { GoogleCloud } from '../lib/google-cloud.js';
import { resolveFirebaseProjectId } from '../utils/firebase-project.js';
import { findRepoRoot } from '../utils/node-version.js';
import type { DoctorCheckResult } from '../utils/node-version.js';

const CRM = 'https://cloudresourcemanager.googleapis.com/v1';
const IAM = 'https://iam.googleapis.com/v1';
const SERVICE_USAGE = 'https://serviceusage.googleapis.com/v1';

export const ACCOUNT_ID = 'github-deploy';
export const POOL_ID = 'github';
export const PROVIDER_ID = 'github';
const ISSUER = 'https://token.actions.githubusercontent.com';

export const REQUIRED_APIS = [
  'iam.googleapis.com',
  'iamcredentials.googleapis.com',
  'sts.googleapis.com',
  'cloudresourcemanager.googleapis.com',
];

// What `firebase deploy`, the preview deploys and the build need, and the manual setup in
// docs/tutorials/04-deploy.md lists. No Firestore writes, Auth users or Storage objects.
export const DEPLOY_ROLES = [
  // Releases and preview channels.
  'roles/firebasehosting.admin',
  // Firestore and Storage rules.
  'roles/firebaserules.admin',
  'roles/datastore.indexAdmin',
  // The build reads the site's content.
  'roles/datastore.viewer',
  // The Storage rules deploy looks up the default bucket.
  'roles/firebasestorage.viewer',
  // Functions, with their Eventarc triggers and Cloud Run services.
  'roles/cloudfunctions.admin',
  // The job that runs scheduleNotifications.
  'roles/cloudscheduler.admin',
  // firebase-tools checks which APIs are on.
  'roles/serviceusage.serviceUsageConsumer',
  // Functions run as the default compute service account.
  'roles/iam.serviceAccountUser',
];

/** Roles that earlier versions granted the deploy account. Setup takes them away. */
export const REMOVED_DEPLOY_ROLES = [
  'roles/firebase.admin',
  'roles/run.admin',
  'roles/artifactregistry.writer',
  'roles/serviceusage.serviceUsageAdmin',
];

export const REQUIRED_PERMISSIONS = [
  'iam.serviceAccounts.create',
  'iam.serviceAccounts.setIamPolicy',
  'iam.workloadIdentityPools.create',
  'iam.workloadIdentityPoolProviders.create',
  'iam.workloadIdentityPoolProviders.update',
  'resourcemanager.projects.setIamPolicy',
  'serviceusage.services.enable',
];

interface Binding {
  role: string;
  members?: string[];
  condition?: unknown;
}

interface Policy {
  bindings?: Binding[];
  etag?: string;
  version?: number;
}

interface Operation {
  name: string;
  done?: boolean;
  error?: { message: string };
}

interface IdentityResource {
  state?: 'ACTIVE' | 'DELETED';
  attributeCondition?: string;
}

export interface GitHubVariables {
  /** Reads a repository variable. Returns undefined when it is missing or gh is unavailable. */
  get(repo: string, name: string): string | undefined;
  /** Sets a repository variable. Returns false when it could not, for example without gh. */
  set(repo: string, name: string, value: string): boolean;
}

export interface SetupGitHubOptions {
  cloud: GoogleCloud;
  github: GitHubVariables;
  projectId: string;
  repo: string;
  dryRun: boolean;
  log?: (message: string) => void;
  sleep?: (ms: number) => Promise<void>;
}

export interface SetupGitHubResult {
  ok: boolean;
  /** What was changed, or with `dryRun`, what would change. Empty when everything is set up. */
  changes: string[];
}

const hasStatus = (error: unknown, ...statuses: number[]) =>
  statuses.includes((error as { status?: number } | undefined)?.status ?? 0);

/** Adds `member` to `role` in `policy`. Returns false when it was already there. */
export const addMember = (policy: Policy, role: string, member: string): boolean => {
  const bindings = (policy.bindings ??= []);
  const binding = bindings.find((entry) => entry.role === role && !entry.condition);
  if (binding?.members?.includes(member)) return false;
  if (binding) {
    (binding.members ??= []).push(member);
  } else {
    bindings.push({ role, members: [member] });
  }
  return true;
};

/** Removes `member` from `role` in `policy`. Returns false when it wasn't there. */
export const removeMember = (policy: Policy, role: string, member: string): boolean => {
  const binding = policy.bindings?.find((entry) => entry.role === role && !entry.condition);
  if (!binding?.members?.includes(member)) return false;
  binding.members = binding.members.filter((entry) => entry !== member);
  if (!binding.members.length)
    policy.bindings = policy.bindings?.filter((entry) => entry !== binding);
  return true;
};

/**
 * Lets GitHub Actions in `repo` deploy to `projectId` with Workload Identity Federation instead of a
 * service account key. Safe to re-run: every step checks first and only changes what is missing.
 * With `dryRun`, it only reads and reports what it would change.
 */
export const setupGitHub = async ({
  cloud,
  github,
  projectId,
  repo,
  dryRun,
  log = console.log,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}: SetupGitHubOptions): Promise<SetupGitHubResult> => {
  const changes: string[] = [];
  const change = (action: string) => {
    changes.push(action);
    log(`• ${dryRun ? 'Would ' : ''}${action}`);
  };

  const getOrUndefined = async <T>(url: string): Promise<T | undefined> => {
    try {
      return await cloud.request<T>('GET', url);
    } catch (error) {
      if (hasStatus(error, 404)) return undefined;
      throw error;
    }
  };

  // IAM is eventually consistent, so a new service account can briefly look missing.
  const retry = async <T>(action: () => Promise<T>): Promise<T> => {
    for (let attempt = 1; ; attempt++) {
      try {
        return await action();
      } catch (error) {
        if (!hasStatus(error, 400, 404) || attempt === 5) throw error;
        await sleep(5000);
      }
    }
  };

  const waitFor = async (base: string, operation: Operation) => {
    let current = operation;
    for (let attempt = 0; !current.done && attempt < 30; attempt++) {
      await sleep(2000);
      current = await cloud.request<Operation>('GET', `${base}/${current.name}`);
    }
    if (current.error) throw new Error(current.error.message);
    if (!current.done) throw new Error(`Timed out waiting for ${current.name}.`);
  };

  const { permissions = [] } = await cloud.request<{ permissions?: string[] }>(
    'POST',
    `${CRM}/projects/${projectId}:testIamPermissions`,
    { permissions: REQUIRED_PERMISSIONS },
  );
  const missing = REQUIRED_PERMISSIONS.filter((permission) => !permissions.includes(permission));
  if (missing.length) {
    log(`✘ Your account is missing these permissions on ${projectId}: ${missing.join(', ')}.`);
    log('  Ask a project owner to run this command, or to grant you the Owner role.');
    if (!dryRun) return { ok: false, changes };
  } else {
    log(`✔ Your account can configure ${projectId}.`);
  }

  const { projectNumber } = await cloud.request<{ projectNumber: string }>(
    'GET',
    `${CRM}/projects/${projectId}`,
  );
  const poolPath = `projects/${projectId}/locations/global/workloadIdentityPools/${POOL_ID}`;
  const providerPath = `${poolPath}/providers/${PROVIDER_ID}`;
  const providerName = `projects/${projectNumber}/locations/global/workloadIdentityPools/${POOL_ID}/providers/${PROVIDER_ID}`;
  const email = `${ACCOUNT_ID}@${projectId}.iam.gserviceaccount.com`;
  const accountPath = `${IAM}/projects/${projectId}/serviceAccounts/${email}`;
  const principal = `principalSet://iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${POOL_ID}/attribute.repository/${repo}`;
  const condition = `assertion.repository == '${repo}'`;

  const disabledApis: string[] = [];
  for (const api of REQUIRED_APIS) {
    const service = await cloud.request<{ state?: string }>(
      'GET',
      `${SERVICE_USAGE}/projects/${projectId}/services/${api}`,
    );
    if (service.state === 'ENABLED') continue;
    disabledApis.push(api);
    change(`enable ${api}`);
    if (!dryRun) {
      const operation = await cloud.request<Operation>(
        'POST',
        `${SERVICE_USAGE}/projects/${projectId}/services/${api}:enable`,
      );
      await waitFor(SERVICE_USAGE, operation);
    }
  }
  if (dryRun && disabledApis.length) {
    log('  The other steps can only be checked once these APIs are enabled.');
    return { ok: true, changes };
  }

  const account = await getOrUndefined(accountPath);
  if (account) {
    log(`✔ Service account ${email} exists.`);
  } else {
    change(`create the service account ${email}`);
    if (!dryRun) {
      await cloud.request('POST', `${IAM}/projects/${projectId}/serviceAccounts`, {
        accountId: ACCOUNT_ID,
        serviceAccount: {
          displayName: 'GitHub Actions deploys',
          description: `Deploys ${repo} from GitHub Actions with Workload Identity Federation.`,
        },
      });
    }
  }

  const projectPolicy = await cloud.request<Policy>(
    'POST',
    `${CRM}/projects/${projectId}:getIamPolicy`,
    { options: { requestedPolicyVersion: 3 } },
  );
  const member = `serviceAccount:${email}`;
  const addedRoles = DEPLOY_ROLES.filter((role) => addMember(projectPolicy, role, member));
  const removedRoles = REMOVED_DEPLOY_ROLES.filter((role) =>
    removeMember(projectPolicy, role, member),
  );
  if (addedRoles.length) change(`grant ${addedRoles.join(', ')} to ${email}`);
  if (removedRoles.length) {
    change(`remove ${removedRoles.join(', ')} from ${email}, which deploys no longer need`);
  }
  if (addedRoles.length || removedRoles.length) {
    if (!dryRun) {
      await retry(() =>
        cloud.request('POST', `${CRM}/projects/${projectId}:setIamPolicy`, {
          policy: projectPolicy,
        }),
      );
    }
  } else {
    log(`✔ ${email} has the deploy roles.`);
  }

  const pool = await getOrUndefined<IdentityResource>(`${IAM}/${poolPath}`);
  if (pool?.state === 'DELETED') {
    change(`restore the deleted workload identity pool ${POOL_ID}`);
    if (!dryRun) {
      await waitFor(IAM, await cloud.request<Operation>('POST', `${IAM}/${poolPath}:undelete`));
    }
  } else if (pool) {
    log(`✔ Workload identity pool ${POOL_ID} exists.`);
  } else {
    change(`create the workload identity pool ${POOL_ID}`);
    if (!dryRun) {
      const operation = await cloud.request<Operation>(
        'POST',
        `${IAM}/projects/${projectId}/locations/global/workloadIdentityPools?workloadIdentityPoolId=${POOL_ID}`,
        { displayName: 'GitHub Actions' },
      );
      await waitFor(IAM, operation);
    }
  }

  const providerBody = {
    displayName: 'GitHub',
    attributeMapping: {
      'google.subject': 'assertion.sub',
      'attribute.repository': 'assertion.repository',
    },
    attributeCondition: condition,
    oidc: { issuerUri: ISSUER },
  };
  const provider = pool
    ? await getOrUndefined<IdentityResource>(`${IAM}/${providerPath}`)
    : undefined;
  if (provider?.state === 'DELETED') {
    change(`restore the deleted provider ${PROVIDER_ID}`);
    if (!dryRun) {
      await waitFor(IAM, await cloud.request<Operation>('POST', `${IAM}/${providerPath}:undelete`));
    }
  }
  if (provider?.attributeCondition === condition) {
    log(`✔ Provider ${PROVIDER_ID} only accepts ${repo}.`);
  } else if (provider) {
    change(
      `limit the provider ${PROVIDER_ID} to ${repo} (now: ${provider.attributeCondition ?? 'any repository'})`,
    );
    if (!dryRun) {
      const operation = await cloud.request<Operation>(
        'PATCH',
        `${IAM}/${providerPath}?updateMask=attributeMapping,attributeCondition`,
        providerBody,
      );
      await waitFor(IAM, operation);
    }
  } else {
    change(`create the provider ${PROVIDER_ID} for ${repo}`);
    if (!dryRun) {
      const operation = await cloud.request<Operation>(
        'POST',
        `${IAM}/${poolPath}/providers?workloadIdentityPoolProviderId=${PROVIDER_ID}`,
        providerBody,
      );
      await waitFor(IAM, operation);
    }
  }

  const accountPolicy: Policy =
    account || !dryRun
      ? await retry(() => cloud.request<Policy>('POST', `${accountPath}:getIamPolicy`))
      : {};
  if (addMember(accountPolicy, 'roles/iam.workloadIdentityUser', principal)) {
    change(`let ${repo} act as ${email}`);
    if (!dryRun) {
      await cloud.request('POST', `${accountPath}:setIamPolicy`, { policy: accountPolicy });
    }
  } else {
    log(`✔ ${repo} can act as ${email}.`);
  }

  const variables = { WIF_PROVIDER: providerName, DEPLOY_SERVICE_ACCOUNT: email };
  for (const [name, value] of Object.entries(variables)) {
    if (github.get(repo, name) === value) {
      log(`✔ The ${repo} repository variable ${name} is set.`);
    } else if (dryRun) {
      change(`set the ${repo} repository variable ${name} to ${value}`);
    } else if (github.set(repo, name, value)) {
      change(`set the ${repo} repository variable ${name}`);
    } else {
      changes.push(`set the ${repo} repository variable ${name}`);
      log(`! Set the ${repo} repository variable ${name} to ${value} in the GitHub settings.`);
    }
  }

  return { ok: true, changes };
};

export interface RunSetupGitHubOptions {
  repo?: string;
  dryRun?: boolean;
}

export const runSetupGitHub = async (options: RunSetupGitHubOptions = {}): Promise<boolean> => {
  const repoRoot = findRepoRoot(process.cwd());
  const projectId = repoRoot && resolveFirebaseProjectId(repoRoot);
  if (!repoRoot || !projectId) {
    console.log('✘ No Firebase project. Set firebase.projectId in packages/config/site.json.');
    return false;
  }
  const repo = options.repo ?? githubRepoFromGit(repoRoot);
  if (!repo) {
    console.log('✘ Could not find the GitHub repository. Pass it with --repo owner/name.');
    return false;
  }

  console.log(
    `Configuring deploys from ${repo} to ${projectId}${options.dryRun ? ' (dry run)' : ''}.\n`,
  );
  try {
    const cloud = await createGoogleCloud(repoRoot, projectId);
    const { ok } = await setupGitHub({
      cloud,
      github: ghVariables,
      projectId,
      repo,
      dryRun: options.dryRun ?? false,
    });
    return ok;
  } catch (error) {
    console.log(`✘ ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
};

/** Warns when GitHub Actions can't deploy to the project. Deploying from a laptop works without it. */
export const checkGitHubDeploys = async (
  repoRoot: string | undefined,
  projectId: string | undefined,
  { createCloud = createGoogleCloud, github = ghVariables } = {},
): Promise<DoctorCheckResult> => {
  const name = 'GitHub deploys';
  if (!repoRoot || !projectId) {
    return { name, ok: true, warning: true, message: 'Skipped, no Firebase project.' };
  }
  const repo = githubRepoFromGit(repoRoot);
  if (!repo) {
    return {
      name,
      ok: true,
      warning: true,
      message: 'Skipped, the origin remote is not on GitHub.',
    };
  }

  try {
    const cloud = await createCloud(repoRoot, projectId);
    const { changes } = await setupGitHub({
      cloud,
      github,
      projectId,
      repo,
      dryRun: true,
      log: () => undefined,
    });
    if (!changes.length) {
      return { name, ok: true, message: `${repo} can deploy to ${projectId} without a key.` };
    }
    return {
      name,
      ok: true,
      warning: true,
      message: `Run \`./hb setup-github\` so ${repo} can deploy to ${projectId}. Missing: ${changes.join('; ')}.`,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { name, ok: true, warning: true, message: `Could not check ${repo}: ${reason}` };
  }
};

/** Reads and sets repository variables with the GitHub CLI, if it is installed and signed in. */
export const ghVariables: GitHubVariables = {
  get(repo, name) {
    const result = spawnSync('gh', ['variable', 'get', name, '--repo', repo], { encoding: 'utf8' });
    return !result.error && result.status === 0 ? result.stdout.trim() : undefined;
  },
  set(repo, name, value) {
    const result = spawnSync('gh', ['variable', 'set', name, '--repo', repo, '--body', value], {
      stdio: 'ignore',
    });
    return !result.error && result.status === 0;
  },
};

/** Reads `owner/name` from the `origin` remote, for example `git@github.com:gdg-x/hoverboard.git`. */
export const githubRepoFromGit = (cwd: string): string | undefined => {
  const result = spawnSync('git', ['remote', 'get-url', 'origin'], { cwd, encoding: 'utf8' });
  return /github\.com[:/]([^/\s]+\/[^/\s]+?)(?:\.git)?\s*$/.exec(result.stdout ?? '')?.[1];
};
