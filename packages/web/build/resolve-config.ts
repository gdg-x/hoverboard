import { Ajv2020, type ErrorObject } from 'ajv/dist/2020.js';
import fs from 'fs';
import { join } from 'path';
import {
  FEATURE_REQUIRES,
  FEATURES,
  isNavigationRoute,
  type Feature,
} from '../src/config/features';
import { deepMerge } from '../src/config/merge';
import { THEMES, type ThemeName } from '../src/themes/index';
import type { Theme } from '../src/themes/tokens';

type Site = typeof import('../defaults/site.json') &
  typeof import('../../config/site.json') & { url: string };
type Resources = typeof import('../defaults/content/resources.json') &
  typeof import('../../config/content/resources.json');

/** Template data. Each file has its own namespace, for example `{{ site.url }}`. */
export interface SiteConfig {
  site: Site;
  resources: Resources;
  /** The built-in theme that `theme.name` picks, with the `theme.colors` overrides. */
  theme: Theme;
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
  /** UI translations, one XLIFF file per locale in `xliff/`. */
  translations: string;
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
  translations: '../translations',
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

const isTimeZone = (timeZone: string) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone });
    return true;
  } catch {
    return false;
  }
};

// The first path segment of each feature's pages.
const FEATURE_PATHS: Record<string, Feature> = {
  blog: 'blog',
  coc: 'codeOfConduct',
  faq: 'faq',
  'previous-speakers': 'previousSpeakers',
  schedule: 'schedule',
  sessions: 'schedule',
  speakers: 'speakers',
  team: 'team',
};

const featureErrors = (site: Site, resources: Resources): string[] => {
  const { features } = site;
  const errors = FEATURES.flatMap((feature) =>
    features[feature]
      ? (FEATURE_REQUIRES[feature] ?? [])
          .filter((required) => !features[required])
          .map((required) => `site.json/features/${feature}: needs ${required}, which is off`)
      : [],
  );
  if (features.map && !site.integrations?.googleMapsApiKey) {
    errors.push('site.json/integrations/googleMapsApiKey: is required when map is on');
  }

  const links: [string, string][] = [
    ...resources.footerRelBlock.flatMap(({ links }, block) =>
      links.map(({ url }, link): [string, string] => [
        `footerRelBlock/${block}/links/${link}/url`,
        url,
      ]),
    ),
    ...resources.aboutOrganizerBlock.blocks.map(({ callToAction }, block): [string, string] => [
      `aboutOrganizerBlock/blocks/${block}/callToAction/link`,
      callToAction.link,
    ]),
  ];
  for (const [path, url] of links) {
    const feature = url.startsWith('/') ? FEATURE_PATHS[url.split('/')[1] ?? ''] : undefined;
    if (feature && !features[feature]) {
      errors.push(`content/resources.json/${path}: "${url}" links to ${feature}, which is off`);
    }
  }
  return errors;
};

// `sourceLocale` in lit-localize.json. The UI text in code is in this locale.
const UI_SOURCE_LOCALE = 'en';

const localeErrors = (site: Site, translationsDir: string): string[] => {
  const { source, targets } = site.locales as { source: string; targets: string[] };
  const errors = targets.includes(source)
    ? [`site.json/locales/targets: includes the source locale "${source}"`]
    : [];
  for (const locale of new Set([source, ...targets])) {
    if (
      locale !== UI_SOURCE_LOCALE &&
      !fs.existsSync(join(translationsDir, 'xliff', `${locale}.xlf`))
    ) {
      errors.push(
        `site.json/locales: "${locale}" has no UI translations in packages/translations/xliff`,
      );
    }
  }
  return errors;
};

// Checks that JSON Schema cannot express.
const crossFileErrors = (site: Site, resources: Resources, paths: ConfigPaths): string[] => {
  const errors = site.navigation.flatMap(({ route }, index) =>
    isNavigationRoute(route)
      ? []
      : [`site.json/navigation/${index}/route: "${route}" is not home or a feature with a page`],
  );
  if (!isTimeZone(site.event.timezone)) {
    errors.push(`site.json/event/timezone: "${site.event.timezone}" is not a known time zone`);
  }
  const images: [string, string | undefined][] = [
    ['site.json/image', site.image],
    ['site.json/heroSettings/home/background/image', site.heroSettings.home.background.image],
    ['content/resources.json/aboutOrganizerBlock/image', resources.aboutOrganizerBlock.image],
  ];
  for (const [path, image] of images) {
    if (image && !isUrl(image) && !fs.existsSync(join(paths.public, image))) {
      errors.push(`${path}: "${image}" is not in packages/web/public`);
    }
  }
  return [...errors, ...localeErrors(site, paths.translations), ...featureErrors(site, resources)];
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
    ...(siteValid && resourcesValid ? crossFileErrors(site, resources, paths) : []),
  ];

  if (siteValid) {
    site.url ??= `https://${site.firebase.projectId}.web.app/`;
    if (!isUrl(site.image)) site.image = `${site.url}${site.image}`;
  }

  const { name, colors } = site.theme as { name: string; colors?: Partial<Theme> };
  const theme = { ...(THEMES[name as ThemeName] ?? THEMES.default), ...colors };

  return { config: { site, resources, theme, NODE_ENV: nodeEnv || 'production' }, errors };
};

/** Like `loadConfig`, but throws a `ConfigError` that lists every problem. */
export const resolveConfig = (options: ResolveOptions = {}): SiteConfig => {
  const { config, errors } = loadConfig(options);
  if (errors.length) throw new ConfigError(errors);
  return config;
};
