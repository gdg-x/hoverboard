import { readFileSync } from 'fs';
import { join } from 'path';
import data from '../../../../../docs/default-firebase-data.json';
import { validateSeedData } from '../../lib/content.js';
import { importBlog } from './blog.js';
import { importConfig } from './config.js';
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

const readFeatures = (path: string): Features =>
  (JSON.parse(readFileSync(path, 'utf8')) as { features?: Features }).features ?? {};

/** The `features` of packages/config/site.json over the upstream defaults. */
export const siteFeatures = (repoRoot = REPO_ROOT): Features => ({
  ...readFeatures(join(repoRoot, 'packages', 'web', 'defaults', 'site.json')),
  ...readFeatures(join(repoRoot, 'packages', 'config', 'site.json')),
});

// Each collection is seeded while any of its features is on.
const COLLECTIONS: [name: string, features: string[], importer: () => unknown][] = [
  ['blog', ['blog'], importBlog],
  ['gallery', ['gallery'], importGallery],
  ['partners', ['partners'], importPartners],
  ['previousSpeakers', ['previousSpeakers'], importPreviousSpeakers],
  // Speaker pages list their sessions too.
  ['sessions', ['schedule', 'speakers'], importSessions],
  ['speakers', ['speakers'], importSpeakers],
  ['team', ['team'], importTeam],
  ['tickets', ['tickets'], importTickets],
  ['videos', ['videos'], importVideos],
];

export const runFirestoreInit = async (features: Features = siteFeatures()): Promise<void> => {
  // Fail before anything is written, rather than part way through.
  validateSeedData(data);
  await importConfig(features); // Should always be first
  const skipped: string[] = [];
  for (const [name, collectionFeatures, importer] of COLLECTIONS) {
    if (collectionFeatures.every((feature) => features[feature] === false)) {
      skipped.push(name);
      continue;
    }
    await importer();
  }
  if (skipped.length) {
    console.log(
      `Skipped the data of features that are off in packages/config/site.json: ${skipped.join(', ')}.`,
    );
  }
  console.log('Finished');
};
