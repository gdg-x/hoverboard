import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { COLLECTIONS } from '../../../storage/collections.js';
import type { CommandResult } from '../lib/command.js';
import { type ExportDocument, readExport } from '../lib/data-format.js';
import { runCommand } from '../lib/spawn.js';
import { setTarget } from '../lib/target.js';
import { resolveFirebaseProjectId } from '../utils/firebase-project.js';
import { findRepoRoot } from '../utils/node-version.js';
import { importDocuments } from './data-import.js';

export interface SyncOptions {
  /** Only these collections, such as `sessions` or `partners/*\/items`. */
  collection?: string[];
  dryRun?: boolean;
  yes?: boolean;
}

/** The content collections, which pull and push make the same on both sides. */
const CONTENT = Object.entries(COLLECTIONS).flatMap(([path, { kind }]) =>
  kind === 'content' ? [path] : [],
);

/**
 * Exports the content of the other side with `hb data export` in its own process, since a process
 * connects to one target.
 */
const exportContent = (
  repoRoot: string,
  { production, collection }: { production: boolean; collection: string[] },
): ExportDocument[] => {
  const folder = mkdtempSync(join(tmpdir(), 'hb-content-'));
  try {
    const status = runCommand(
      process.execPath,
      [
        'hb',
        'data',
        'export',
        folder,
        '--content',
        ...collection.flatMap((path) => ['--collection', path]),
        ...(production ? ['--production'] : []),
      ],
      repoRoot,
    );
    if (status !== 0) {
      throw new Error(
        `Couldn't export the content of ${production ? 'production' : 'the emulator'}.`,
      );
    }
    return readExport(folder).documents;
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
};

const projectOf = (repoRoot: string) => {
  const projectId = resolveFirebaseProjectId(repoRoot);
  if (!projectId) {
    throw new Error('No Firebase project. Set firebase.projectId in packages/config/site.json.');
  }
  return projectId;
};

/**
 * Makes the emulator's content the same as production's: exports production's content, then
 * imports it into the emulator with replace. Visitor data stays in production.
 */
export const runDataPull = async ({ collection = [], dryRun = false }: SyncOptions = {}): Promise<
  CommandResult | false
> => {
  const repoRoot = findRepoRoot(process.cwd()) ?? process.cwd();
  const projectId = projectOf(repoRoot);
  setTarget('emulator');
  const documents = exportContent(repoRoot, { production: true, collection });
  return importDocuments(documents, projectId, {
    collection,
    replace: true,
    entries: CONTENT,
    dryRun,
    command: 'hb data pull',
  });
};

/**
 * Makes production's content the same as the emulator's: exports the emulator's content, then
 * imports it into production with replace, after showing the changes and asking.
 */
export const runDataPush = async ({
  collection = [],
  dryRun = false,
  yes = false,
}: SyncOptions = {}): Promise<CommandResult | false> => {
  const repoRoot = findRepoRoot(process.cwd()) ?? process.cwd();
  projectOf(repoRoot);
  const documents = exportContent(repoRoot, { production: false, collection });
  if (!documents.length) {
    // Most likely the wrong emulator data, and pushing it would delete all the content.
    console.log(
      `✘ The emulator has no content${collection.length ? ' in those collections' : ''}, so nothing was pushed.`,
    );
    return false;
  }
  setTarget('production');
  return importDocuments(documents, 'the emulator', {
    collection,
    replace: true,
    entries: CONTENT,
    dryRun,
    yes,
    command: 'hb data push',
  });
};
