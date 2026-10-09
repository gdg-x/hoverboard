import { readFileSync } from 'fs';
import { join } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkFunctions, EXPECTED_FUNCTIONS } from './functions.js';

const { listDeployedFunctionsMock } = vi.hoisted(() => ({ listDeployedFunctionsMock: vi.fn() }));

vi.mock('../lib/deployed-functions.js', () => ({
  listDeployedFunctions: listDeployedFunctionsMock,
}));

const deployed = (id: string, platform = 'gcfv2') => ({ id, region: 'us-central1', platform });

afterEach(() => {
  vi.clearAllMocks();
});

describe('EXPECTED_FUNCTIONS', () => {
  it('lists every function that packages/server/functions exports', () => {
    const index = readFileSync(
      join(import.meta.dirname, '..', '..', '..', 'server', 'functions', 'src', 'index.ts'),
      'utf8',
    );
    const exported = /export \{([^}]*)\}/
      .exec(index)![1]!
      .split(',')
      .map((name) => name.trim());

    expect(EXPECTED_FUNCTIONS).toEqual(exported.filter(Boolean).sort());
  });
});

describe('checkFunctions', () => {
  it('skips with a warning when no project is selected', async () => {
    expect(await checkFunctions('/repo', undefined)).toMatchObject({ ok: true, warning: true });
    expect(listDeployedFunctionsMock).not.toHaveBeenCalled();
  });

  it('passes when every function is deployed as 2nd gen', async () => {
    listDeployedFunctionsMock.mockResolvedValue(EXPECTED_FUNCTIONS.map((id) => deployed(id)));

    const result = await checkFunctions('/repo', 'demo-project');

    expect(result).toEqual({
      name: 'Cloud Functions',
      ok: true,
      message: 'All 4 functions are deployed as 2nd gen.',
    });
    expect(listDeployedFunctionsMock).toHaveBeenCalledWith('/repo', 'demo-project');
  });

  it('fails on a 1st gen function, and says how to replace it', async () => {
    listDeployedFunctionsMock.mockResolvedValue([
      deployed('mailchimpSubscribe', 'gcfv1'),
      ...EXPECTED_FUNCTIONS.slice(1).map((id) => deployed(id)),
    ]);

    const result = await checkFunctions('/repo', 'demo-project');

    expect(result.ok).toBe(false);
    expect(result.warning).toBeUndefined();
    expect(result.message).toBe(
      "mailchimpSubscribe is 1st gen, which a deploy can't upgrade to 2nd gen. Delete it with " +
        '`npx firebase functions:delete mailchimpSubscribe --region us-central1`, then run `./hbd deploy`.',
    );
  });

  it('warns about missing functions and functions no longer in the code', async () => {
    listDeployedFunctionsMock.mockResolvedValue([
      ...EXPECTED_FUNCTIONS.slice(2).map((id) => deployed(id)),
      deployed('sessionsWrite', 'gcfv1'),
    ]);

    const result = await checkFunctions('/repo', 'demo-project');

    expect(result).toMatchObject({ ok: true, warning: true });
    expect(result.message).toBe(
      'mailchimpSubscribe, optimizeImages are not deployed. Run `./hbd deploy`. ' +
        'sessionsWrite is no longer in the code. The next deploy deletes it.',
    );
  });

  it('warns when the functions could not be listed', async () => {
    listDeployedFunctionsMock.mockRejectedValue(new Error('Not logged in to Firebase.'));

    const result = await checkFunctions('/repo', 'demo-project');

    expect(result).toMatchObject({ ok: true, warning: true });
    expect(result.message).toContain('Not logged in to Firebase.');
  });
});
