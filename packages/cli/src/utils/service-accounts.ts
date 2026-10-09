import { createGoogleCloud } from '../lib/google-cloud.js';
import type { DoctorCheckResult } from './node-version.js';

const name = 'Service accounts';
const IAM = 'https://iam.googleapis.com/v1';

interface ServiceAccount {
  email: string;
  disabled?: boolean;
}

interface ServiceAccountKey {
  validAfterTime?: string;
  disabled?: boolean;
}

/** `firebase init hosting:github` creates these. `hb setup-github` deploys without them. */
const isOldGitHubAccount = (email: string) => /^github-action-[\w-]+@/.test(email);

/**
 * Warns about user-managed keys on the project's service accounts, which never expire and work
 * from anywhere, and about the accounts that deployed from GitHub before `hb setup-github`.
 */
export const checkServiceAccounts = async (
  repoRoot: string | undefined,
  projectId: string | undefined,
  { createCloud = createGoogleCloud } = {},
): Promise<DoctorCheckResult> => {
  if (!repoRoot || !projectId) {
    return { name, ok: true, warning: true, message: 'Skipped, no Firebase project.' };
  }

  const withKeys: string[] = [];
  const oldGitHub: string[] = [];
  try {
    const cloud = await createCloud(repoRoot, projectId);
    const accounts: ServiceAccount[] = [];
    let pageToken = '';
    do {
      const page = await cloud.request<{ accounts?: ServiceAccount[]; nextPageToken?: string }>(
        'GET',
        `${IAM}/projects/${projectId}/serviceAccounts?pageSize=100${pageToken && `&pageToken=${encodeURIComponent(pageToken)}`}`,
      );
      accounts.push(...(page.accounts ?? []));
      pageToken = page.nextPageToken ?? '';
    } while (pageToken);

    for (const { email, disabled } of accounts) {
      if (disabled) continue;
      if (isOldGitHubAccount(email)) oldGitHub.push(email);
      const { keys = [] } = await cloud.request<{ keys?: ServiceAccountKey[] }>(
        'GET',
        `${IAM}/projects/${projectId}/serviceAccounts/${email}/keys?keyTypes=USER_MANAGED`,
      );
      const active = keys.filter((key) => !key.disabled);
      if (!active.length) continue;
      const oldest = active.map((key) => key.validAfterTime?.slice(0, 10) ?? '').sort()[0];
      withKeys.push(
        `${email} (${active.length} ${active.length === 1 ? 'key' : 'keys'}${oldest ? `, the oldest from ${oldest}` : ''})`,
      );
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      name,
      ok: true,
      warning: true,
      message: `Could not list the service accounts of ${projectId}: ${reason}`,
    };
  }

  const problems = [
    ...(withKeys.length
      ? [
          `Keys that never expire: ${withKeys.join('; ')}. Hoverboard deploys and runs without ` +
            'keys. Delete them, and any GitHub secret that holds one, in the Google Cloud console ' +
            'under IAM > Service accounts > Keys.',
        ]
      : []),
    ...(oldGitHub.length
      ? [
          `${oldGitHub.join(', ')} deployed from GitHub before \`./hb setup-github\`. Delete ` +
            `${oldGitHub.length === 1 ? 'it' : 'them'} in the Google Cloud console under IAM > ` +
            'Service accounts, once the deploy workflows use `./hb setup-github`.',
        ]
      : []),
  ];
  if (!problems.length) return { name, ok: true, message: 'No service account keys.' };
  return { name, ok: true, warning: true, message: problems.join(' ') };
};
