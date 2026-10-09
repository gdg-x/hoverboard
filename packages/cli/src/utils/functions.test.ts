import { readFileSync } from 'fs';
import { join } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkFunctions, EXPECTED_FUNCTIONS } from './functions.js';

const { listDeployedFunctionsMock, functionsEnabledMock } = vi.hoisted(() => ({
  listDeployedFunctionsMock: vi.fn(),
  functionsEnabledMock: vi.fn(() => true),
}));

vi.mock('../lib/deployed-functions.js', () => ({
  listDeployedFunctions: listDeployedFunctionsMock,
}));
vi.mock('./site-features.js', () => ({ functionsEnabled: functionsEnabledMock }));

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
      message: 'All 2 functions are deployed as 2nd gen.',
    });
    expect(listDeployedFunctionsMock).toHaveBeenCalledWith('/repo', 'demo-project');
  });

  it('fails on a 1st gen function, and says how to replace it', async () => {
    listDeployedFunctionsMock.mockResolvedValue([
      deployed('scheduleNotifications', 'gcfv1'),
      ...EXPECTED_FUNCTIONS.slice(1).map((id) => deployed(id)),
    ]);

    const result = await checkFunctions('/repo', 'demo-project');

    expect(result.ok).toBe(false);
    expect(result.warning).toBeUndefined();
    expect(result.message).toBe(
      "scheduleNotifications is 1st gen, which a deploy can't upgrade to 2nd gen. Delete it with " +
        '`npx firebase functions:delete scheduleNotifications --region us-central1`, then run `./hb deploy`.',
    );
  });

  it('warns about missing functions and functions no longer in the code', async () => {
    listDeployedFunctionsMock.mockResolvedValue([
      ...EXPECTED_FUNCTIONS.slice(1).map((id) => deployed(id)),
      deployed('mailchimpSubscribe'),
      deployed('optimizeImages'),
    ]);

    const result = await checkFunctions('/repo', 'demo-project');

    expect(result).toMatchObject({ ok: true, warning: true });
    expect(result.message).toBe(
      'scheduleNotifications is not deployed. Run `./hb deploy`. ' +
        'mailchimpSubscribe, optimizeImages are no longer in the code. The next deploy deletes them.',
    );
  });

  it('warns when the functions could not be listed', async () => {
    listDeployedFunctionsMock.mockRejectedValue(new Error('Not logged in to Firebase.'));

    const result = await checkFunctions('/repo', 'demo-project');

    expect(result).toMatchObject({ ok: true, warning: true });
    expect(result.message).toContain('Not logged in to Firebase.');
  });

  describe('with features.functions off', () => {
    it('passes when no function is deployed', async () => {
      functionsEnabledMock.mockReturnValueOnce(false);
      listDeployedFunctionsMock.mockResolvedValue([]);

      expect(await checkFunctions('/repo', 'demo-project')).toEqual({
        name: 'Cloud Functions',
        ok: true,
        message: 'None deployed, as features.functions is false.',
      });
    });

    it('warns about functions still deployed, which deploys leave in place', async () => {
      functionsEnabledMock.mockReturnValueOnce(false);
      listDeployedFunctionsMock.mockResolvedValue([deployed('sendGeneralNotification')]);

      const result = await checkFunctions('/repo', 'demo-project');

      expect(result).toMatchObject({ ok: true, warning: true });
      expect(result.message).toBe(
        'features.functions is false, but sendGeneralNotification is still deployed, and deploys leave it ' +
          'in place. Delete it with `npx firebase functions:delete sendGeneralNotification --region us-central1`.',
      );
    });
  });
});
