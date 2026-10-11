import { resolve } from 'path';
import type { Firestore } from 'firebase-admin/firestore';
import type { CommandResult } from '../lib/command.js';
import {
  type ExportDocument,
  type Manifest,
  encode,
  inPath,
  kindOf,
  versions,
  writeExport,
} from '../lib/data-format.js';
import { backupName } from '../lib/firestore-fix.js';
import { productionProjectId } from '../lib/target.js';
import { DEMO_PROJECT_ID } from '../utils/firebase-project.js';
import { findRepoRoot } from '../utils/node-version.js';
import { listAllDocuments } from './data-check.js';

export interface ExportOptions {
  /** Registry or collection paths to export, such as `speakers` or `partners/*\/items`. */
  collection?: string[];
  /** Only content, without visitor, function and CLI data. */
  content?: boolean;
  /** Also collections Hoverboard doesn't use, such as retired ones. */
  all?: boolean;
}

/**
 * The documents of an export: the registry's collections, or the requested ones, with every
 * Firestore type kept. Documents that only have subcollections are left out.
 */
export const exportDocuments = async (
  firestore: Firestore,
  { collection = [], content = false, all = false }: ExportOptions = {},
): Promise<ExportDocument[]> => {
  const roots = [...new Set(collection.map((path) => path.replace(/^\/+/, '').split('/')[0]!))];
  const listed = collection.length
    ? (await Promise.all(roots.map((root) => listAllDocuments(firestore, root)))).flat()
    : await listAllDocuments(firestore);
  return listed
    .filter(({ path, raw }) => {
      if (!raw) return false;
      if (collection.length && !collection.some((requested) => inPath(path, requested))) {
        return false;
      }
      const kind = kindOf(path);
      if (content) return kind === 'content';
      return all || collection.length > 0 || (kind !== 'retired' && kind !== 'unknown');
    })
    .map(({ path, raw }) => ({ path, data: encode(raw) as Record<string, unknown> }));
};

/** What a manifest holds, one line per registry path. */
export const manifestLines = ({ collections }: Manifest): string[] =>
  Object.entries(collections).map(
    ([entry, { documents, personal }]) =>
      `  ${entry}: ${documents} ${documents === 1 ? 'document' : 'documents'}${personal ? ' (personal data)' : ''}`,
  );

/** Exports Firestore to a folder in the data format, `hoverboard-export-<time>` by default. */
export const runDataExport = async (
  folder: string | undefined,
  options: ExportOptions & { command?: string } = {},
): Promise<CommandResult> => {
  const repoRoot = findRepoRoot(process.cwd()) ?? process.cwd();
  const projectId = productionProjectId(repoRoot);
  const output = resolve(
    process.env['INIT_CWD'] ?? process.cwd(),
    folder ?? `hoverboard-export-${backupName()}`,
  );
  const { firestore } = await import('../lib/firestore.js');
  const documents = await exportDocuments(firestore, options);
  const manifest = writeExport(output, documents, {
    ...versions(repoRoot),
    projectId: projectId ?? DEMO_PROJECT_ID,
    createdAt: new Date().toISOString(),
    command: options.command ?? 'hb data export',
  });
  for (const line of manifestLines(manifest)) console.log(line);
  console.log(
    `✔ Exported ${documents.length} documents from ${projectId ?? 'the emulator'} to ${output}.`,
  );
  if (Object.values(manifest.collections).some(({ personal }) => personal)) {
    console.log('! It holds personal data, such as emails or push tokens. Keep it private.');
  }
  return {
    ok: true,
    folder: output,
    collections: Object.fromEntries(
      Object.entries(manifest.collections).map(([entry, { documents: count }]) => [entry, count]),
    ),
  };
};
