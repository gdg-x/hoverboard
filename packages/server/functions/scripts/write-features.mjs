// Copies the feature flags into dist/, because functions deploy without the rest of the repo.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const defaults = readJson('../../../web/defaults/site.json');
const siteUrl = new URL('../../../config/site.json', import.meta.url);
const site = existsSync(siteUrl) ? readJson(siteUrl) : {};

const features = { ...defaults.features, ...site.features };
mkdirSync(new URL('../dist/', import.meta.url), { recursive: true });
writeFileSync(
  new URL('../dist/features.json', import.meta.url),
  `${JSON.stringify(features, null, 2)}\n`,
);
