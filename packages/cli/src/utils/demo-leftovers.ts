import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { CONFIG_DIR, DEMO_CONFIG_DIR, siteConfigDir } from './firebase-project.js';
import type { DoctorCheckResult } from './node-version.js';

type Json = Record<string, unknown>;

const MAX_LISTED = 10;

const readJson = (path: string): Json =>
  existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as Json) : {};

const files = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        return statSync(path).isDirectory() ? files(path) : [path];
      })
    : [];

// Text worth replacing: a sentence or a name, not a short label or a path such as "/coc".
const isProse = (value: unknown): value is string =>
  typeof value === 'string' && value.length >= 20 && value.includes(' ');

/** Keys under `path` whose prose is the same in `site` as in `demo`. */
const sameText = (site: unknown, demo: unknown, path: string): string[] => {
  if (isProse(site)) return site === demo ? [path] : [];
  if (site && demo && typeof site === 'object' && typeof demo === 'object') {
    return Object.entries(site as Json).flatMap(([key, value]) =>
      sameText(value, (demo as Json)[key], `${path}/${key}`),
    );
  }
  return [];
};

/**
 * What the site still has from the demo, which `hb init` copied: images in `public/` that are the
 * same file, text in `content/resources.json`, the highlights video and social links. Each is a
 * file and a key, or a file.
 */
export const demoLeftovers = (repoRoot: string): string[] => {
  const site = join(repoRoot, CONFIG_DIR);
  const demo = join(repoRoot, DEMO_CONFIG_DIR);
  const images = files(join(site, 'public')).filter((path) => {
    const demoFile = join(demo, relative(site, path));
    return existsSync(demoFile) && readFileSync(path).equals(readFileSync(demoFile));
  });
  const resources = readJson(join(site, 'content', 'resources.json'));
  const demoResources = readJson(join(demo, 'content', 'resources.json'));
  const video = (json: Json) =>
    ((json['aboutBlock'] as Json | undefined)?.['callToAction'] as Json | undefined)?.[
      'howItWas'
    ] as Json | undefined;
  const follow = (json: Json) =>
    ((json['social'] as Json | undefined)?.['follow'] as { url?: string }[] | undefined) ?? [];
  const demoLinks = new Set(follow(readJson(join(demo, 'site.json'))).map(({ url }) => url));

  return [
    ...images.map((path) => `${relative(repoRoot, path)}: the demo's image`),
    ...sameText(resources, demoResources, `${CONFIG_DIR}/content/resources.json`).map(
      (path) => `${path}: the demo's text`,
    ),
    ...(video(resources)?.['youtubeId'] &&
    video(resources)?.['youtubeId'] === video(demoResources)?.['youtubeId']
      ? [`${CONFIG_DIR}/content/resources.json/aboutBlock/callToAction/howItWas: the demo's video`]
      : []),
    ...follow(readJson(join(site, 'site.json')))
      .filter(({ url }) => demoLinks.has(url))
      .map(({ url }) => `${CONFIG_DIR}/site.json/social/follow: the demo's link ${url}`),
  ];
};

/** The leftovers as lines to print, at most `MAX_LISTED` of them. */
export const formatLeftovers = (leftovers: string[]): string[] => [
  ...leftovers.slice(0, MAX_LISTED).map((leftover) => `    ${leftover}`),
  ...(leftovers.length > MAX_LISTED ? [`    and ${leftovers.length - MAX_LISTED} more`] : []),
];

const name = 'Demo leftovers';

export const checkDemoLeftovers = (repoRoot: string | undefined): DoctorCheckResult => {
  if (!repoRoot || siteConfigDir(repoRoot) === DEMO_CONFIG_DIR) {
    return { name, ok: true, message: 'Skipped, the site is the demo.' };
  }
  const leftovers = demoLeftovers(repoRoot);
  if (!leftovers.length) return { name, ok: true, message: 'Nothing left from the demo.' };
  return {
    name,
    ok: true,
    warning: true,
    message:
      `${leftovers.length} thing(s) are still the demo's. Replace them with your event's:\n` +
      formatLeftovers(leftovers).join('\n'),
  };
};
