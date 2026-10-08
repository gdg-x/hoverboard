import { readFileSync } from 'fs';
import { join } from 'path';
import data from '../../../../../docs/default-firebase-data.json';
import { validateSeedData } from '../../lib/content.js';
import { importBlog } from './blog.js';
import { importConfig } from './config.js';
import { importGallery } from './gallery.js';
import { importPartners } from './partners.js';
import { importPreviousSpeakers } from './previous-speakers.js';
import { importSchedule } from './schedule.js';
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

const COLLECTIONS: [name: string, feature: string, importer: () => unknown][] = [
  ['blog', 'blog', importBlog],
  ['gallery', 'gallery', importGallery],
  ['partners', 'partners', importPartners],
  ['previousSpeakers', 'previousSpeakers', importPreviousSpeakers],
  ['schedule', 'schedule', importSchedule],
  ['sessions', 'schedule', importSessions],
  ['speakers', 'speakers', importSpeakers],
  ['team', 'team', importTeam],
  ['tickets', 'tickets', importTickets],
  ['videos', 'videos', importVideos],
];

export const runFirestoreInit = async (features: Features = siteFeatures()): Promise<void> => {
  // Fail before anything is written, rather than part way through.
  validateSeedData(data);
  await importConfig(features); // Should always be first
  const skipped: string[] = [];
  for (const [name, feature, importer] of COLLECTIONS) {
    if (features[feature] === false) {
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
