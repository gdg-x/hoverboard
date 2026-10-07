import fs from 'fs';
import { join } from 'path';
import { deepMerge } from '../src/config/merge';

type Site = typeof import('../defaults/site.json') & typeof import('../../config/site.json');
type Resources = typeof import('../defaults/content/resources.json') &
  typeof import('../../config/content/resources.json');

/** Template data. Each file has its own namespace, for example `{{ site.url }}`. */
export interface SiteConfig {
  site: Site;
  resources: Resources;
  NODE_ENV: string;
}

export interface ConfigPaths {
  /** Upstream defaults. */
  defaults: string;
  /** The site's own config, which only contains what it changes. */
  site: string;
  /** `<BUILD_ENV>.json` overrides for `site.json`. */
  environments: string;
}

const { BUILD_ENV, NODE_ENV } = process.env;
export const production = NODE_ENV === 'production';
export const watch = process.argv.includes('--watch');

// Vite runs with packages/web as the working directory.
export const CONFIG_PATHS: ConfigPaths = {
  defaults: 'defaults',
  site: '../config',
  environments: '../../config',
};

const readJson = <T>(path: string): T => JSON.parse(fs.readFileSync(path, 'utf8')) as T;

// `BUILD_ENV`, or `development` for development builds, picks an optional override file.
const readEnvironment = (dir: string, buildEnv: string | undefined, isProduction: boolean) => {
  const name = buildEnv || (isProduction ? undefined : 'development');
  if (!name) return {};

  const path = join(dir, `${name}.json`);
  if (!fs.existsSync(path)) {
    if (buildEnv) throw new Error(`BUILD_ENV is ${buildEnv}, but ${path} does not exist.`);
    return {};
  }
  console.log(`Using ${path} over site.json.`);
  return readJson<Partial<Site>>(path);
};

/** Reads the defaults, then the site's config over them. The dev server and the build both use it. */
export const resolveConfig = ({
  paths = CONFIG_PATHS,
  buildEnv = BUILD_ENV,
  nodeEnv = NODE_ENV,
}: {
  paths?: ConfigPaths;
  buildEnv?: string | undefined;
  nodeEnv?: string | undefined;
} = {}): SiteConfig => {
  const site = deepMerge(
    deepMerge(
      readJson<object>(join(paths.defaults, 'site.json')),
      readJson<object>(join(paths.site, 'site.json')),
    ),
    readEnvironment(paths.environments, buildEnv, nodeEnv === 'production'),
  ) as Site;
  const resources = deepMerge(
    readJson<object>(join(paths.defaults, 'content', 'resources.json')),
    readJson<object>(join(paths.site, 'content', 'resources.json')),
  ) as Resources;

  if (!resources.image.startsWith('http')) {
    resources.image = `${site.url}${resources.image}`;
  }

  return { site, resources, NODE_ENV: nodeEnv || 'production' };
};
