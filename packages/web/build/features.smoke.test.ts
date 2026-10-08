import { cpSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { buildSite, type SiteBuild } from '../__tests__/helpers/build-site';
import { FEATURE_REQUIRES, FEATURES, type Feature } from '../src/config/features';
import { enabledRoutes } from './routes';

declare module 'vitest' {
  export interface ProvidedContext {
    featureOff: Feature;
  }
}

const siteConfig = fileURLToPath(new URL('../../config', import.meta.url));

// Features that need the one under test are off too, as in a valid site.json.
const withDependents = (feature: Feature): Feature[] => [
  feature,
  ...FEATURES.filter((other) => FEATURE_REQUIRES[other]?.includes(feature)).flatMap(withDependents),
];

const featureOff = inject('featureOff');
const off = new Set(withDependents(featureOff));
const features = Object.fromEntries(
  FEATURES.map((feature) => [feature, !off.has(feature)]),
) as Record<Feature, boolean>;

const FEATURE_PATHS: Partial<Record<Feature, string[]>> = {
  blog: ['/blog'],
  codeOfConduct: ['/coc'],
  faq: ['/faq'],
  mySchedule: ['/schedule/my-schedule'],
  previousSpeakers: ['/previous-speakers'],
  schedule: ['/schedule', '/sessions'],
  speakers: ['/speakers'],
  team: ['/team'],
};

// The chunks of each feature's pages and home blocks.
const FEATURE_CHUNKS: Partial<Record<Feature, string[]>> = {
  blog: ['blog-list-page', 'post-page', 'latest-posts-block'],
  codeOfConduct: ['coc-page'],
  faq: ['faq-page'],
  forkMe: ['fork-me-block'],
  gallery: ['gallery-block'],
  map: ['map-block'],
  mySchedule: ['my-schedule'],
  partners: ['partners-block'],
  previousSpeakers: ['previous-speakers-page', 'previous-speaker-page'],
  schedule: ['schedule-page', 'session-page'],
  speakers: ['speakers-page', 'speaker-page', 'speakers-block'],
  subscribe: ['subscribe-block'],
  team: ['team-page'],
  tickets: ['tickets-block'],
  videos: ['featured-videos'],
};

const offPaths = [...off].flatMap((feature) => FEATURE_PATHS[feature] ?? []);
const isOffPath = (href: string) => {
  const { origin, pathname } = new URL(href, 'https://site.test/');
  return (
    origin === 'https://site.test' &&
    offPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  );
};

// Pages with an id in their path build only from content, which these builds do not read.
const pageFile = (pattern: string) =>
  pattern === '/' ? 'index.html' : `${pattern.replace('/[...day]', '')}.html`.slice(1);
const expectedPages = [
  '404.html',
  'offline.html',
  ...enabledRoutes(features)
    .map(({ pattern }) => pattern)
    .filter((pattern) => !pattern.includes('[') || pattern.endsWith('[...day]'))
    .map(pageFile),
].sort();

const writeConfig = (configDir: string) => {
  cpSync(siteConfig, configDir, { recursive: true });
  const sitePath = join(configDir, 'site.json');
  const site = JSON.parse(readFileSync(sitePath, 'utf8'));
  site.features = features;
  site.integrations = { googleMapsApiKey: 'test-key', ...site.integrations };
  writeFileSync(sitePath, JSON.stringify(site));

  // Config validation rejects content links to pages of features that are off.
  const resourcesPath = join(configDir, 'content/resources.json');
  const resources = JSON.parse(readFileSync(resourcesPath, 'utf8'));
  for (const block of resources.footerRelBlock) {
    block.links = block.links.filter(({ url }: { url: string }) => !isOffPath(url));
  }
  resources.aboutOrganizerBlock.blocks = resources.aboutOrganizerBlock.blocks.filter(
    ({ callToAction }: { callToAction: { link: string } }) => !isOffPath(callToAction.link),
  );
  writeFileSync(resourcesPath, JSON.stringify(resources));
};

describe(`a build with ${[...off].join(', ')} off`, () => {
  let build: SiteBuild;

  beforeAll(() => {
    build = buildSite(writeConfig);
  });

  afterAll(() => build.remove());

  it('builds', () => {
    expect(build.status, build.stderr).toBe(0);
  });

  it('builds the pages of every feature that is on, and no others', () => {
    expect(build.pages).toEqual(expectedPages);
  });

  it('does not link to pages of features that are off', () => {
    const links = build.pages.flatMap((page) =>
      [...build.read(page).matchAll(/href="([^"]*)"/g)].map(([, href]) => `${page}: ${href}`),
    );

    expect(links.filter((link) => isOffPath(link.split(': ')[1] ?? ''))).toEqual([]);
  });

  it('leaves out the pages and home blocks of features that are off', () => {
    const offChunks = [...off].flatMap((feature) => FEATURE_CHUNKS[feature] ?? []);

    expect(build.chunks.filter((chunk) => offChunks.includes(chunk))).toEqual([]);
  });
});
