import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { listDeployedFunctions } from './deployed-functions.js';

const dirsToClean: string[] = [];

afterEach(() => {
  for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** A repo with a fake firebase-tools that has just the internals listDeployedFunctions uses. */
const makeRepo = (endpoints: object[]): string => {
  const repo = mkdtempSync(join(tmpdir(), 'hoverboard-cli-'));
  dirsToClean.push(repo);
  const lib = join(repo, 'node_modules', 'firebase-tools', 'lib');
  mkdirSync(join(lib, 'deploy', 'functions'), { recursive: true });
  writeFileSync(join(lib, '..', 'package.json'), '{ "name": "firebase-tools" }');
  writeFileSync(
    join(lib, 'auth.js'),
    `exports.selectAccount = () => ({ user: { email: 'a@example.com' }, tokens: {} });
exports.setActiveAccount = (options, account) => { options.user = account.user; };`,
  );
  writeFileSync(
    join(lib, 'requireAuth.js'),
    `exports.requireAuth = async (options) => { if (!options.user) throw new Error('no user'); };`,
  );
  writeFileSync(
    join(lib, 'deploy', 'functions', 'backend.js'),
    `exports.existingBackend = async ({ projectId }) => ({ projectId });
exports.allEndpoints = (backend) =>
  backend.projectId === 'demo-project' ? ${JSON.stringify(endpoints)} : [];`,
  );
  return repo;
};

describe('listDeployedFunctions', () => {
  it("lists the project's functions with their region and platform", async () => {
    const repo = makeRepo([
      { id: 'optimizeImages', region: 'us-central1', platform: 'gcfv2', runtime: 'nodejs22' },
    ]);

    await expect(listDeployedFunctions(repo, 'demo-project')).resolves.toEqual([
      { id: 'optimizeImages', region: 'us-central1', platform: 'gcfv2' },
    ]);
  });
});
