import { readFileSync } from 'fs';
import { join } from 'path';
import { writeSite } from '../lib/firestore-fix.js';
import {
  CONFIG_MIGRATIONS,
  type ConfigMigration,
  schemaVersionAfter,
} from '../migrations/config.js';
import { siteConfigPath } from '../utils/firebase-project.js';
import { findRepoRoot } from '../utils/node-version.js';
import { validateSiteConfig } from '../utils/site-config.js';
import { runDataCheck } from './data-check.js';

export interface UpgradeOptions {
  /** Show the changes without writing them. */
  dryRun?: boolean;
  /** Change production Firestore without asking. */
  yes?: boolean;
  /** Also run the data migrations. On by default. */
  data?: boolean;
}

/**
 * Moves site.json to the current `schemaVersion`, then runs the Firestore data
 * migrations and fixes with `data check --fix`. Returns whether both succeeded.
 */
export const runUpgrade = async (
  { dryRun = false, yes = false, data = true }: UpgradeOptions = {},
  migrations: ConfigMigration[] = CONFIG_MIGRATIONS,
): Promise<boolean> => {
  const repoRoot = findRepoRoot(process.cwd()) ?? process.cwd();
  const sitePath = siteConfigPath(repoRoot);
  const site = JSON.parse(readFileSync(join(repoRoot, sitePath), 'utf8')) as Record<
    string,
    unknown
  >;
  const version = site['schemaVersion'];
  const current = schemaVersionAfter(migrations);

  if (typeof version !== 'number') {
    console.log(
      `✘ ${sitePath} has no schemaVersion, so it's from before v4. hb upgrade supports v4 ` +
        'and later. Sites from before v4 relaunch on v4, see docs/releases.md#supported-versions.',
    );
    return false;
  }
  if (version > current) {
    console.log(
      `✘ ${sitePath} is at schemaVersion ${version}, newer than this Hoverboard ` +
        `(${current}). Update Hoverboard first.`,
    );
    return false;
  }

  const pending = migrations.filter((migration) => migration.version > version);
  if (!pending.length) {
    console.log(`✔ ${sitePath} is at schemaVersion ${version}, the current one.\n`);
  } else {
    for (const { version: to, description } of pending) {
      console.log(`Config migration ${to}: ${description}`);
    }
    if (dryRun) {
      console.log(`\nDry run: ${sitePath} wasn't changed.\n`);
    } else {
      writeSite(repoRoot, (config) => ({
        ...pending.reduce((next, migration) => migration.migrate(next), config),
        schemaVersion: current,
      }));
      const errors = await validateSiteConfig(repoRoot);
      for (const error of errors) console.log(`✘ ${error}`);
      if (errors.length) return false;
      console.log(`\n✔ Moved ${sitePath} to schemaVersion ${current}. Commit it.\n`);
    }
  }

  return data ? runDataCheck({ fix: true, dryRun, yes }) : true;
};
