import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { isBillingEnabled } from './billing.js';

const dirsToClean: string[] = [];
const originalEnv = { ...process.env };

afterEach(() => {
  for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
  process.env = { ...originalEnv };
});

const makeRepo = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'hoverboard-cli-'));
  dirsToClean.push(dir);
  return dir;
};

/** Writes a fake firebase-tools with just the internals isBillingEnabled uses. */
const installFakeFirebaseTools = (
  repoRoot: string,
  { signedIn, billingEnabled }: { signedIn: boolean; billingEnabled: boolean },
): void => {
  const lib = join(repoRoot, 'node_modules', 'firebase-tools', 'lib');
  mkdirSync(join(lib, 'gcp'), { recursive: true });
  writeFileSync(join(lib, '..', 'package.json'), '{ "name": "firebase-tools" }');
  writeFileSync(
    join(lib, 'auth.js'),
    `exports.selectAccount = () => (${signedIn} ? { user: { email: 'a@example.com' }, tokens: {} } : undefined);
exports.setActiveAccount = (options, account) => { options.user = account.user; options.tokens = account.tokens; };`,
  );
  writeFileSync(
    join(lib, 'requireAuth.js'),
    `exports.requireAuth = async (options) => { if (!options.user) throw new Error('no user'); };`,
  );
  writeFileSync(
    join(lib, 'gcp', 'cloudbilling.js'),
    `exports.checkBillingEnabled = async () => ${billingEnabled};`,
  );
};

describe('isBillingEnabled', () => {
  it('returns true when billing is enabled for the signed-in account', async () => {
    const repo = makeRepo();
    installFakeFirebaseTools(repo, { signedIn: true, billingEnabled: true });

    await expect(isBillingEnabled(repo, 'demo-project')).resolves.toBe(true);
  });

  it('returns false when billing is disabled', async () => {
    const repo = makeRepo();
    installFakeFirebaseTools(repo, { signedIn: true, billingEnabled: false });

    await expect(isBillingEnabled(repo, 'demo-project')).resolves.toBe(false);
  });

  it('throws when nobody is signed in to the Firebase CLI', async () => {
    const repo = makeRepo();
    installFakeFirebaseTools(repo, { signedIn: false, billingEnabled: true });
    delete process.env['GOOGLE_APPLICATION_CREDENTIALS'];

    await expect(isBillingEnabled(repo, 'demo-project')).rejects.toThrow('firebase login');
  });

  it('throws when firebase-tools is not installed', async () => {
    await expect(isBillingEnabled(makeRepo(), 'demo-project')).rejects.toThrow();
  });
});
