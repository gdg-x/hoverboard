import { describe, expect, it } from 'vitest';
import type { GoogleCloud } from '../lib/google-cloud.js';
import { checkServiceAccounts } from './service-accounts.js';

const IAM = 'https://iam.googleapis.com/v1/projects/demo-project/serviceAccounts';

/** A fake Google Cloud with these accounts and their user-managed keys. */
const fakeCloud = (
  accounts: Record<string, { validAfterTime?: string; disabled?: boolean }[]>,
  { disabled = [] as string[], pageSize = 100 } = {},
) => {
  const requests: string[] = [];
  const emails = Object.keys(accounts);
  const cloud: GoogleCloud = {
    async request<T>(_method: string, url: string): Promise<T> {
      requests.push(url);
      const { pathname, searchParams } = new URL(url);
      if (url.startsWith(`${IAM}?`)) {
        const start = Number(searchParams.get('pageToken') ?? 0);
        const next = start + pageSize;
        return {
          accounts: emails
            .slice(start, next)
            .map((email) => ({ email, disabled: disabled.includes(email) })),
          ...(next < emails.length ? { nextPageToken: String(next) } : {}),
        } as T;
      }
      const email = /serviceAccounts\/([^/]+)\/keys$/.exec(pathname)?.[1] ?? '';
      expect(searchParams.get('keyTypes')).toBe('USER_MANAGED');
      return { keys: accounts[email] } as T;
    },
  };
  return { createCloud: async () => cloud, requests };
};

const check = (cloud: ReturnType<typeof fakeCloud>) =>
  checkServiceAccounts('/repo', 'demo-project', { createCloud: cloud.createCloud });

describe('checkServiceAccounts', () => {
  it('skips without a Firebase project', async () => {
    expect(await checkServiceAccounts('/repo', undefined)).toMatchObject({
      ok: true,
      warning: true,
      message: 'Skipped, no Firebase project.',
    });
  });

  it('passes when no service account has a key', async () => {
    const cloud = fakeCloud({
      '123-compute@developer.gserviceaccount.com': [],
      'github-deploy@demo-project.iam.gserviceaccount.com': [],
    });

    expect(await check(cloud)).toEqual({
      name: 'Service accounts',
      ok: true,
      message: 'No service account keys.',
    });
  });

  it('warns about every account with keys, with how many and the oldest', async () => {
    const cloud = fakeCloud({
      'firebase-adminsdk-abc@demo-project.iam.gserviceaccount.com': [
        { validAfterTime: '2023-09-04T01:58:20Z' },
        { validAfterTime: '2018-07-12T18:22:49Z' },
      ],
      'deploy@demo-project.iam.gserviceaccount.com': [{ validAfterTime: '2026-10-07T00:21:15Z' }],
      'github-deploy@demo-project.iam.gserviceaccount.com': [],
    });

    const result = await check(cloud);

    expect(result).toMatchObject({ ok: true, warning: true });
    expect(result.message).toBe(
      'Keys that never expire: ' +
        'firebase-adminsdk-abc@demo-project.iam.gserviceaccount.com (2 keys, the oldest from 2018-07-12); ' +
        'deploy@demo-project.iam.gserviceaccount.com (1 key, the oldest from 2026-10-07). ' +
        'Hoverboard deploys and runs without keys. Delete them, and any GitHub secret that holds ' +
        'one, in the Google Cloud console under IAM > Service accounts > Keys.',
    );
  });

  it('leaves out disabled keys and disabled accounts', async () => {
    const cloud = fakeCloud(
      {
        'old@demo-project.iam.gserviceaccount.com': [{ validAfterTime: '2018-01-01T00:00:00Z' }],
        'deploy@demo-project.iam.gserviceaccount.com': [{ disabled: true }],
      },
      { disabled: ['old@demo-project.iam.gserviceaccount.com'] },
    );

    expect((await check(cloud)).message).toBe('No service account keys.');
    expect(cloud.requests.some((url) => url.includes('/old@'))).toBe(false);
  });

  it('warns about the accounts that deployed from GitHub before setup-github', async () => {
    const cloud = fakeCloud({
      'github-action-39275042@demo-project.iam.gserviceaccount.com': [],
      'github-action-site@demo-project.iam.gserviceaccount.com': [],
    });

    expect((await check(cloud)).message).toBe(
      'github-action-39275042@demo-project.iam.gserviceaccount.com, ' +
        'github-action-site@demo-project.iam.gserviceaccount.com deployed from GitHub before ' +
        '`./hb setup-github`. Delete them in the Google Cloud console under IAM > Service ' +
        'accounts, once the deploy workflows use `./hb setup-github`.',
    );
  });

  it('reads every page of service accounts', async () => {
    const cloud = fakeCloud(
      {
        'a@demo-project.iam.gserviceaccount.com': [],
        'b@demo-project.iam.gserviceaccount.com': [],
        'c@demo-project.iam.gserviceaccount.com': [{ validAfterTime: '2020-01-01T00:00:00Z' }],
      },
      { pageSize: 2 },
    );

    expect((await check(cloud)).message).toContain('c@demo-project.iam.gserviceaccount.com');
  });

  it('warns when the service accounts could not be listed', async () => {
    const result = await checkServiceAccounts('/repo', 'demo-project', {
      createCloud: async () => {
        throw new Error('Not logged in to Firebase.');
      },
    });

    expect(result).toMatchObject({ ok: true, warning: true });
    expect(result.message).toBe(
      'Could not list the service accounts of demo-project: Not logged in to Firebase.',
    );
  });
});
