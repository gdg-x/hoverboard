import { join } from 'path';
import { COLLECTIONS, type CollectionPath } from '../../../../storage/collections.js';
import data from '../../../../../docs/default-firebase-data.json';
import type { CommandResult } from '../../lib/command.js';
import { validateSeedData } from '../../lib/content.js';
import { confirmChange } from '../../lib/prompt.js';
import { productionProjectId } from '../../lib/target.js';
import { siteFeatures } from '../../utils/site-features.js';
import { importBlog } from './blog.js';
import { importConfig, seededConfig } from './config.js';
import { importGallery } from './gallery.js';
import { importPartners } from './partners.js';
import { importPreviousSpeakers } from './previous-speakers.js';
import { importSessions } from './sessions.js';
import { importSpeakers } from './speakers.js';
import { importTeam } from './team.js';
import { importTickets } from './tickets.js';
import { importVideos } from './videos.js';

type Features = Record<string, boolean>;

const REPO_ROOT = join(import.meta.dirname, '..', '..', '..', '..', '..');

// Each collection is seeded while any of its features is on.
const IMPORTERS: [name: CollectionPath, importer: () => unknown][] = [
  ['blog', importBlog],
  ['gallery', importGallery],
  ['partners', importPartners],
  ['previousSpeakers', importPreviousSpeakers],
  ['sessions', importSessions],
  ['speakers', importSpeakers],
  ['team', importTeam],
  ['tickets', importTickets],
  ['videos', importVideos],
];

export interface SeedOptions {
  /** Show what would be written, without writing it. */
  dryRun?: boolean;
  /** Write to production without asking. */
  yes?: boolean;
}

const isOff = (name: CollectionPath, features: Features) =>
  COLLECTIONS[name].features.every((feature) => features[feature] === false);

/** The number of documents the seed writes to each collection, with their subcollections. */
export const seedPlan = (features: Features): { documents: Record<string, number> } => {
  const nested = (groups: { items?: unknown[]; members?: unknown[] }[]) =>
    groups.reduce((sum, group) => sum + 1 + (group.items ?? group.members ?? []).length, 0);
  const counts: Record<CollectionPath, number> = {
    ...(Object.fromEntries(
      IMPORTERS.map(([name]) => [name, Object.keys(data[name as keyof typeof data]).length]),
    ) as Record<CollectionPath, number>),
    partners: nested(data.partners),
    team: nested(data.team),
  };
  const config = seededConfig(features).length;
  return {
    documents: {
      ...(config ? { config } : {}),
      ...Object.fromEntries(
        IMPORTERS.filter(([name]) => !isOff(name, features)).map(([name]) => [name, counts[name]]),
      ),
    },
  };
};

export const runFirestoreInit = async (
  features: Features = siteFeatures(REPO_ROOT),
  { dryRun = false, yes = false }: SeedOptions = {},
): Promise<CommandResult | false> => {
  // Fail before anything is written, rather than part way through.
  validateSeedData(data);
  const { documents } = seedPlan(features);
  const projectId = productionProjectId(REPO_ROOT);
  const target = projectId ?? 'the emulator';
  const skipped = IMPORTERS.filter(([name]) => isOff(name, features)).map(([name]) => name);
  const total = Object.values(documents).reduce((sum, count) => sum + count, 0);
  const list = Object.entries(documents)
    .map(([name, count]) => `${name} (${count})`)
    .join(', ');
  if (skipped.length) {
    console.log(
      `Skipped the data of features that are off in packages/config/site.json: ${skipped.join(', ')}.`,
    );
  }
  if (dryRun) {
    console.log(
      `Would write ${total} documents to ${target}: ${list}.\nDry run: nothing was written.`,
    );
    return { ok: true, documents, skipped, dryRun };
  }
  if (
    projectId &&
    !(await confirmChange(
      `Write ${total} sample documents to ${projectId}? Documents with the same IDs are replaced.`,
      yes,
    ))
  ) {
    return false;
  }

  await importConfig(features); // Should always be first
  for (const [name, importer] of IMPORTERS) {
    if (!isOff(name, features)) await importer();
  }
  console.log(`✔ Wrote ${total} documents to ${target}.`);
  return { ok: true, documents, skipped, dryRun };
};
