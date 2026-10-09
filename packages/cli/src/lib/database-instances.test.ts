import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { listDatabaseInstances } from './database-instances.js';

const dirsToClean: string[] = [];

afterEach(() => {
  for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** A repo with a fake firebase-tools that has just the internals listDatabaseInstances uses. */
const makeRepo = (instances: object[]): string => {
  const repo = mkdtempSync(join(tmpdir(), 'hoverboard-cli-'));
  dirsToClean.push(repo);
  const lib = join(repo, 'node_modules', 'firebase-tools', 'lib');
  mkdirSync(join(lib, 'management'), { recursive: true });
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
    join(lib, 'management', 'database.js'),
    `exports.listDatabaseInstances = async (projectId, location) =>
  projectId === 'demo-project' && location === '-' ? ${JSON.stringify(instances)} : [];`,
  );
  return repo;
};

describe('listDatabaseInstances', () => {
  it("lists the project's instances in every location", async () => {
    const repo = makeRepo([
      {
        name: 'demo-project-default-rtdb',
        location: 'us-central1',
        project: 'demo-project',
        databaseUrl: 'https://demo-project-default-rtdb.firebaseio.com',
        type: 'DEFAULT_DATABASE',
        state: 'ACTIVE',
      },
    ]);

    await expect(listDatabaseInstances(repo, 'demo-project')).resolves.toEqual([
      { name: 'demo-project-default-rtdb', location: 'us-central1', state: 'ACTIVE' },
    ]);
  });
});
