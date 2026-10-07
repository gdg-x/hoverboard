import { Ajv2020, type ErrorObject } from 'ajv/dist/2020.js';
import fs from 'fs';
import { join } from 'path';
import { isFeature } from '../src/config/features';
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
  schemas: string;
  /** Where images referenced by the config must exist. */
  public: string;
}

export interface ResolveOptions {
  paths?: ConfigPaths;
  nodeEnv?: string | undefined;
}

const { NODE_ENV } = process.env;
export const production = NODE_ENV === 'production';
export const watch = process.argv.includes('--watch');

const RELATIVE_PATHS: ConfigPaths = {
  defaults: 'defaults',
  site: '../config',
  schemas: 'schemas',
  public: 'public',
};

/** Config paths for a `packages/web` directory. */
export const configPaths = (webRoot: string): ConfigPaths =>
  Object.fromEntries(
    Object.entries(RELATIVE_PATHS).map(([key, path]) => [key, join(webRoot, path)]),
  ) as unknown as ConfigPaths;

// Vite runs with packages/web as the working directory.
export const CONFIG_PATHS: ConfigPaths = RELATIVE_PATHS;

export class ConfigError extends Error {
  constructor(readonly errors: string[]) {
    super(`Invalid site config:\n${errors.map((error) => `  - ${error}`).join('\n')}`);
    this.name = 'ConfigError';
  }
}

const readJson = <T>(path: string): T => JSON.parse(fs.readFileSync(path, 'utf8')) as T;

const formatErrors = (file: string, errors: ErrorObject[] | null | undefined): string[] =>
  (errors ?? []).map(({ instancePath, message, params }) => {
    const property = params['additionalProperty'] as string | undefined;
    const extra = property ? ` "${property}"` : '';
    return `${file}${instancePath}: ${message ?? 'is invalid'}${extra}`;
  });

const isUrl = (value: string) => /^https?:\/\//.test(value);

// Checks that JSON Schema cannot express.
const crossFileErrors = (site: Site, resources: Resources, publicDir: string): string[] => {
  const errors = site.navigation.flatMap(({ route }, index) =>
    route === 'home' || isFeature(route)
      ? []
      : [`site.json/navigation/${index}/route: "${route}" is not home or a feature`],
  );
  const images: [string, string | undefined][] = [
    ['site.json/image', site.image],
    ['site.json/heroSettings/home/background/image', site.heroSettings.home.background.image],
    ['content/resources.json/aboutOrganizerBlock/image', resources.aboutOrganizerBlock.image],
  ];
  for (const [path, image] of images) {
    if (image && !isUrl(image) && !fs.existsSync(join(publicDir, image))) {
      errors.push(`${path}: "${image}" is not in packages/web/public`);
    }
  }
  return errors;
};

/**
 * Reads the defaults, then the site's config over them, and validates the result. The dev
 * server, the build and the CLI all use it, so they see the same config.
 */
export const loadConfig = ({ paths = CONFIG_PATHS, nodeEnv = NODE_ENV }: ResolveOptions = {}): {
  config: SiteConfig;
  errors: string[];
} => {
  const site = deepMerge(
    readJson<object>(join(paths.defaults, 'site.json')),
    readJson<object>(join(paths.site, 'site.json')),
  ) as Site;
  const resources = deepMerge(
    readJson<object>(join(paths.defaults, 'content', 'resources.json')),
    readJson<object>(join(paths.site, 'content', 'resources.json')),
  ) as Resources;

  const ajv = new Ajv2020({ allErrors: true });
  const validateSite = ajv.compile(readJson(join(paths.schemas, 'site.schema.json')));
  const validateResources = ajv.compile(readJson(join(paths.schemas, 'resources.schema.json')));
  const siteValid = validateSite(site);
  const resourcesValid = validateResources(resources);
  const errors = [
    ...formatErrors('site.json', validateSite.errors),
    ...formatErrors('content/resources.json', validateResources.errors),
    ...(siteValid && resourcesValid ? crossFileErrors(site, resources, paths.public) : []),
  ];

  if (siteValid && !isUrl(site.image)) {
    site.image = `${site.url}${site.image}`;
  }

  return { config: { site, resources, NODE_ENV: nodeEnv || 'production' }, errors };
};

/** Like `loadConfig`, but throws a `ConfigError` that lists every problem. */
export const resolveConfig = (options: ResolveOptions = {}): SiteConfig => {
  const { config, errors } = loadConfig(options);
  if (errors.length) throw new ConfigError(errors);
  return config;
};
