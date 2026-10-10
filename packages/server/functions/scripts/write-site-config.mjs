// Copies the site.json values that functions use into dist/, because functions deploy without the
// rest of the repo.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const defaults = readJson('../../../web/defaults/site.json');
const siteUrl = new URL('../../../config/site.json', import.meta.url);
const site = existsSync(siteUrl) ? readJson(siteUrl) : {};

const siteConfig = {
  features: { ...defaults.features, ...site.features },
  timeZone: site.event?.timezone ?? 'UTC',
  attendance: site.event?.attendance ?? defaults.event?.attendance ?? 'inPerson',
  ...(site.event?.stream && { stream: site.event.stream }),
  trackStreams: Object.fromEntries(
    (site.schedule?.tracks ?? []).flatMap(({ id, stream }) => (stream ? [[id, stream]] : [])),
  ),
};
mkdirSync(new URL('../dist/', import.meta.url), { recursive: true });
writeFileSync(
  new URL('../dist/site-config.json', import.meta.url),
  `${JSON.stringify(siteConfig, null, 2)}\n`,
);
