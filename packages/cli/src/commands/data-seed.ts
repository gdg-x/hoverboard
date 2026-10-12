import { join } from 'path';
import { collectionInfo } from '../../../storage/collections.js';
import type { CommandResult } from '../lib/command.js';
import { SAMPLE_DATA, entryFor, readExport } from '../lib/data-format.js';
import { findRepoRoot } from '../utils/node-version.js';
import { siteFeatures } from '../utils/site-features.js';
import { type ImportOptions, runDataImport } from './data-import.js';

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
