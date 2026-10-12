import { existsSync } from 'fs';
import { join } from 'path';
import { COLLECTIONS, collectionInfo } from '../../../storage/collections.js';
import {
  STAGE_FIXTURES,
  type StageFixture,
  fixtureDocuments,
} from '../../../web/__tests__/fixtures/stages.js';
import { wallClock } from '../../../web/src/utils/time-zone.js';
import { type CommandResult, UsageError } from '../lib/command.js';
import { siteTimeZone } from '../lib/content.js';
import { SAMPLE_DATA, entryFor, kindOf, readExport } from '../lib/data-format.js';
import { target } from '../lib/target.js';
import { findRepoRoot } from '../utils/node-version.js';
import { siteFeatures } from '../utils/site-features.js';
import { type ImportOptions, importDocuments, runDataImport } from './data-import.js';

/** Whether a document's collection is in use: one of its features is on, or it has none. */
export const inUse = (path: string, features: Record<string, boolean>): boolean => {
  const info = collectionInfo(path);
  return !info?.features.length || info.features.some((feature) => features[feature] !== false);
};

/** Imports the sample data, without the collections of features that are off. */
export const runDataSeed = async (
  options: Pick<ImportOptions, 'dryRun' | 'yes'> = {},
  features?: Record<string, boolean>,
): Promise<CommandResult | false> => {
  const repoRoot = findRepoRoot(process.cwd()) ?? process.cwd();
  const folder = join(repoRoot, SAMPLE_DATA);
  const on = features ?? siteFeatures(repoRoot);
  const skipped = [
    ...new Set(
      readExport(folder)
        .documents.filter(({ path }) => !inUse(path, on))
        .map(({ path }) => entryFor(path)),
    ),
  ];
  if (skipped.length) {
    console.log(
      `Skipped the data of features that are off in packages/config/site.json: ${skipped.join(', ')}.`,
    );
  }
  const result = await runDataImport(folder, {
    ...options,
    include: (path) => inUse(path, on),
    command: 'hb data seed',
  });
  return result && { ...result, skipped };
};

const CONTENT = Object.entries(COLLECTIONS).flatMap(([path, { kind }]) =>
  kind === 'content' ? [path] : [],
);

/**
 * Replaces the emulator's content with a stage fixture: part of the sample data, on the demo's
 * event days. Then the dev bar's clock and the fixture's site.json changes show its stage.
 */
export const runStageSeed = async (
  name: string,
  options: Pick<ImportOptions, 'dryRun' | 'yes'> = {},
): Promise<CommandResult | false> => {
  if (target() === 'production') {
    throw new UsageError('--stage only seeds the emulator. Leave out --production.');
  }
  const fixture = (STAGE_FIXTURES as Record<string, StageFixture>)[name];
  if (!fixture) {
    throw new UsageError(
      `No stage fixture "${name}". The fixtures are: ${Object.keys(STAGE_FIXTURES).join(', ')}.`,
    );
  }
  const repoRoot = findRepoRoot(process.cwd()) ?? process.cwd();
  if (existsSync(join(repoRoot, 'packages', 'config', 'site.json'))) {
    console.log(
      `! The fixtures are on the demo's event days, in 2017, which packages/config/site.json ` +
        "doesn't have. They're for Hoverboard's own demo site.",
    );
  }
  const folder = join(repoRoot, SAMPLE_DATA);
  const result = await importDocuments(
    fixtureDocuments(fixture, readExport(folder).documents),
    folder,
    {
      ...options,
      // The content collections the fixture doesn't have are emptied too.
      replace: true,
      entries: CONTENT,
      include: (path) => kindOf(path) === 'content',
      command: `hb data seed --stage ${name}`,
    },
  );
  if (!result) return false;

  const { date, time } = wallClock(new Date(fixture.time), siteTimeZone());
  console.log(
    `\nThe ${name} fixture is in these stages at ${date} ${time}. Pick that time on the dev ` +
      `bar's clock: ${fixture.stages.join(', ')}.`,
  );
  if (fixture.site) {
    console.log('It also changes site.json, which you change by hand to see it:');
    console.log(JSON.stringify(fixture.site, null, 2));
  }
  return { ...result, stage: name, time: fixture.time, stages: fixture.stages };
};
