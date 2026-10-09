import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ConfigMigration } from '../migrations/config.js';
import { SITE_CONFIG_PATH } from '../utils/firebase-project.js';
import { runUpgrade } from './upgrade.js';

const { runFirestoreCheckMock, validateSiteConfigMock } = vi.hoisted(() => ({
  runFirestoreCheckMock: vi.fn(async () => true),
  validateSiteConfigMock: vi.fn(async (): Promise<string[]> => []),
}));

vi.mock('./firestore-check.js', () => ({ runFirestoreCheck: runFirestoreCheckMock }));
vi.mock('../utils/site-config.js', () => ({ validateSiteConfig: validateSiteConfigMock }));

const dirsToClean: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const makeRepo = (site: Record<string, unknown>): string => {
  const dir = mkdtempSync(join(tmpdir(), 'hoverboard-upgrade-'));
  dirsToClean.push(dir);
  mkdirSync(join(dir, '.git'));
  mkdirSync(join(dir, 'packages/config'), { recursive: true });
  writeFileSync(join(dir, SITE_CONFIG_PATH), JSON.stringify(site));
  vi.spyOn(process, 'cwd').mockReturnValue(dir);
  return dir;
};

const readSite = (repo: string) =>
  JSON.parse(readFileSync(join(repo, SITE_CONFIG_PATH), 'utf8')) as Record<string, unknown>;

const output = () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  return () => log.mock.calls.flat().join('\n');
};

// Renames `shortName` to `name`, then adds `added`.
const migrations: ConfigMigration[] = [
  {
    version: 2,
    description: 'Rename shortName to name.',
    migrate: ({ shortName, ...site }) => ({ ...site, name: shortName }),
  },
  { version: 3, description: 'Add added.', migrate: (site) => ({ ...site, added: true }) },
];

describe('runUpgrade', () => {
  it('refuses a site.json without schemaVersion, from before v4', async () => {
    makeRepo({ shortName: 'DevFest' });
    const text = output();

    expect(await runUpgrade({}, migrations)).toBe(false);
    expect(text()).toContain('from before v4');
    expect(runFirestoreCheckMock).not.toHaveBeenCalled();
  });

  it('refuses a site.json newer than this Hoverboard', async () => {
    makeRepo({ schemaVersion: 4 });
    const text = output();

    expect(await runUpgrade({}, migrations)).toBe(false);
    expect(text()).toContain('schemaVersion 4, newer than this Hoverboard (3)');
  });

  it('runs the pending config migrations in order, then the Firestore fixes', async () => {
    const repo = makeRepo({ schemaVersion: 1, shortName: 'DevFest' });
    const text = output();

    expect(await runUpgrade({ yes: true }, migrations)).toBe(true);
    expect(readSite(repo)).toEqual({ schemaVersion: 3, name: 'DevFest', added: true });
    expect(text()).toContain('Config migration 2: Rename shortName to name.');
    expect(text()).toContain('Moved packages/config/site.json to schemaVersion 3.');
    expect(runFirestoreCheckMock).toHaveBeenCalledWith({ fix: true, dryRun: false, yes: true });
  });

  it('only runs the migrations after the current version', async () => {
    const repo = makeRepo({ schemaVersion: 2, shortName: 'DevFest' });
    output();

    await runUpgrade({}, migrations);

    expect(readSite(repo)).toEqual({ schemaVersion: 3, shortName: 'DevFest', added: true });
  });

  it('writes nothing in a dry run, and passes it on', async () => {
    const repo = makeRepo({ schemaVersion: 1, shortName: 'DevFest' });
    const text = output();

    await runUpgrade({ dryRun: true }, migrations);

    expect(readSite(repo)).toEqual({ schemaVersion: 1, shortName: 'DevFest' });
    expect(text()).toContain("Dry run: packages/config/site.json wasn't changed.");
    expect(runFirestoreCheckMock).toHaveBeenCalledWith({ fix: true, dryRun: true, yes: false });
  });

  it('stops before Firestore when the migrated config is invalid', async () => {
    makeRepo({ schemaVersion: 1, shortName: 'DevFest' });
    validateSiteConfigMock.mockResolvedValueOnce(['site.json: missing "shortName".']);
    const text = output();

    expect(await runUpgrade({}, migrations)).toBe(false);
    expect(text()).toContain('✘ site.json: missing "shortName".');
    expect(runFirestoreCheckMock).not.toHaveBeenCalled();
  });

  it('goes straight to Firestore when site.json is current', async () => {
    makeRepo({ schemaVersion: 1 });
    const text = output();

    expect(await runUpgrade({})).toBe(true);
    expect(text()).toContain('is at schemaVersion 1, the current one.');
    expect(runFirestoreCheckMock).toHaveBeenCalled();
  });
});
