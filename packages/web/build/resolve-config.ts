import { Ajv2020, type ErrorObject, type ValidateFunction } from 'ajv/dist/2020.js';
import fs from 'fs';
import { join } from 'path';
import {
  FEATURE_REQUIRES,
  FEATURES,
  isNavigationRoute,
  type Feature,
} from '../src/config/features';
import { deepMerge, isPlainObject } from '../src/config/merge';
import { fontProblems } from './fonts';
import { iconErrors } from './icons';
import { sanitizeSvg } from './svg';
import {
  type ResolvedTheme,
  type SiteTheme,
  heroPhotoErrors,
  resolveTheme,
  themeErrors,
} from './theme';

/** `heroSettings` in site.json. The demo site sets none. */
interface HeroSettings {
  home?: { background?: { image: string }; illustration?: string };
}

/** How people attend the event. */
export type Attendance = 'inPerson' | 'online' | 'hybrid';

type SiteJson = typeof import('../defaults/site.json') &
  typeof import('../../demo-config/site.json');
/** `event.location` in site.json. */
export type Venue = SiteJson['event']['location'];

type Site = Omit<SiteJson, 'event'> & {
  url: string;
  heroSettings?: HeroSettings;
  /** Set on an archived edition, which is read-only. */
  archive?: { year: number; current: string };
  event: Omit<SiteJson['event'], 'attendance' | 'location'> & {
    attendance: Attendance;
    stream?: string;
    /** Required, except for an online event. */
    location?: Venue;
  };
};
type DemoResources = typeof import('../../demo-config/content/resources.json');
type AboutBlock = DemoResources['aboutBlock'];
type Resources = Omit<DemoResources, 'attendingPage' | 'aboutBlock'> & {
  attendingPage?: AttendingPage;
  aboutBlock: Omit<AboutBlock, 'callToAction'> & {
    callToAction: Omit<AboutBlock['callToAction'], 'howItWas'> & {
      /** The highlights video. A first edition has none. */
      howItWas?: AboutBlock['callToAction']['howItWas'];
    };
  };
};

interface Image {
  image: string;
  alt: string;
}

/** `attendingPage` in content/resources.json: what only the organizers know. Text is markdown. */
export interface AttendingPage {
  description?: string;
  photo?: Image;
  floorPlan?: Image;
  online?: string;
  gettingThere?: {
    mode:
      'train' | 'plane' | 'bus' | 'tram' | 'metro' | 'car' | 'parking' | 'bike' | 'walk' | 'other';
    title?: string;
    text: string;
  }[];
  /** `day` is `YYYY-MM-DD`, and `open` and `close` are `HH:MM` in `event.timezone`. */
  doors?: { day: string; open: string; close: string; note?: string }[];
  accessibility?: string;
  accommodation?: {
    text?: string;
    hotels?: { name: string; address?: string; note?: string; code?: string; url?: string }[];
  };
  atVenue?: {
    topic:
      | 'wifi'
      | 'food'
      | 'cloakroom'
      | 'firstAid'
      | 'quietRoom'
      | 'lostAndFound'
      | 'childcare'
      | 'other';
    title?: string;
    text: string;
  }[];
}

/** Template data. Each file has its own namespace, for example `{{ site.url }}`. */
export interface SiteConfig {
  site: Site;
  resources: Resources;
  /** The built-in theme that `theme.name` picks, with the site's colors and settings over it. */
  theme: ResolvedTheme;
  /** `content/locales/<locale>/resources.json` by locale, the keys to merge over `resources`. */
  contentTranslations: Record<string, object>;
  /** Paths of the translated markdown pages, `content/locales/<locale>/<page>.md`, by locale. */
  contentMarkdown: Record<string, Partial<Record<MarkdownPage, string>>>;
  NODE_ENV: string;
}

export interface ConfigPaths {
  /** Upstream defaults. */
  defaults: string;
  /** The site's own config, which only contains what it changes. */
  site: string;
  schemas: string;
  /** Where images referenced by the config can be: the site's `public` first, then packages/web's. */
  public: string[];
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

/** The site's config folder, relative to packages/web: packages/config once it has a site.json. */
export const siteConfigDir = (webRoot: string, { demo = false } = {}): string =>
  !demo && fs.existsSync(join(webRoot, '../config/site.json')) ? '../config' : '../demo-config';

/** Config paths for a `packages/web` directory. Tests pass `demo`, so a fork's config can't fail them. */
export const configPaths = (webRoot: string, { demo = false } = {}): ConfigPaths => {
  const site = join(webRoot, siteConfigDir(webRoot, { demo }));
  return {
    defaults: join(webRoot, 'defaults'),
    site,
    schemas: join(webRoot, 'schemas'),
    public: [join(site, 'public'), join(webRoot, 'public')],
    translations: join(webRoot, '../translations'),
  };
};

// Vite runs with packages/web as the working directory.
export const CONFIG_PATHS: ConfigPaths = configPaths('.');

/** A file in the first public folder that has it, or undefined. */
export const publicFile = (publicDirs: string[], file: string): string | undefined =>
  publicDirs.map((dir) => join(dir, file)).find((path) => fs.existsSync(path));

export class ConfigError extends Error {
  constructor(readonly errors: string[]) {
    super(`Invalid site config:\n${errors.map((error) => `  - ${error}`).join('\n')}`);
    this.name = 'ConfigError';
  }
}

const readJson = <T>(path: string): T => JSON.parse(fs.readFileSync(path, 'utf8')) as T;

/** Reads a file in packages/config. Invalid JSON throws a `ConfigError` naming the file. */
const readSiteJson = <T>(paths: ConfigPaths, file: string): T => {
  try {
    return readJson<T>(join(paths.site, file));
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    throw new ConfigError([`${file}: is not valid JSON. ${error.message.replaceAll(/\s+/g, ' ')}`]);
  }
};

const formatErrors = (file: string, errors: ErrorObject[] | null | undefined): string[] =>
  (errors ?? [])
    // `if` only repeats the errors of its branch.
    .filter(({ keyword }) => keyword !== 'if')
    .map(({ instancePath, message, params }) => {
      const property = params['additionalProperty'] as string | undefined;
      const extra = property ? ` "${property}"` : '';
      return `${file}${instancePath}: ${message ?? 'is invalid'}${extra}`;
    });

const isUrl = (value: string) => /^https?:\/\//.test(value);

const IN_PUBLIC = 'is not in packages/config/public or packages/web/public';

const imageErrors = (images: [string, string | undefined][], publicDirs: string[]): string[] =>
  images.flatMap(([path, image]) =>
    image && !isUrl(image) && !publicFile(publicDirs, image)
      ? [`${path}: "${image}" ${IN_PUBLIC}`]
      : [],
  );

/** Checks `attendingPage` from `file`, the source content or a translation merged over it. */
const attendingErrors = (
  site: Site,
  page: AttendingPage | undefined,
  file: string,
  paths: ConfigPaths,
): string[] => {
  if (!page) return [];
  const path = `${file}/attendingPage`;
  const { startDate, endDate } = site.event;
  return [
    ...imageErrors(
      [
        [`${path}/photo/image`, page.photo?.image],
        [`${path}/floorPlan/image`, page.floorPlan?.image],
      ],
      paths.public,
    ),
    ...(page.doors ?? []).flatMap(({ day, open, close }, index) => [
      ...(day < startDate || day > endDate
        ? [`${path}/doors/${index}/day: "${day}" is not between event.startDate and event.endDate`]
        : []),
      ...(close <= open
        ? [`${path}/doors/${index}/close: "${close}" is not after open, "${open}"`]
        : []),
    ]),
  ];
};

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
  attending: 'attending',
  blog: 'blog',
  coc: 'codeOfConduct',
  faq: 'faq',
  'previous-speakers': 'previousSpeakers',
  schedule: 'schedule',
  sessions: 'schedule',
  speakers: 'speakers',
  team: 'team',
};

/** Features an archived edition has off: the ones that write, and the blog, which moves on. */
export const ARCHIVE_OFF = [
  'blog',
  'demo',
  'feedback',
  'forkMe',
  'functions',
  'mySchedule',
  'notifications',
  'subscribe',
] as const satisfies readonly Feature[];

const featureErrors = (site: Site, resources: Resources): string[] => {
  const { features } = site;
  const errors = FEATURES.flatMap((feature) =>
    features[feature]
      ? (FEATURE_REQUIRES[feature] ?? [])
          .filter((required) => !features[required])
          .map((required) => `site.json/features/${feature}: needs ${required}, which is off`)
      : [],
  );
  const needSignIn = (['mySchedule', 'feedback'] as const).filter((feature) => features[feature]);
  if (needSignIn.length && !site.auth.providers.length) {
    errors.push(
      `site.json/auth/providers: ${needSignIn.join(' and ')} need a way to sign in, and there is none`,
    );
  }
  if (site.event.attendance === 'online') {
    if (features.map) {
      errors.push('site.json/features/map: needs a venue, and event.attendance is online');
    }
    if (!site.event.stream) {
      errors.push('site.json/event/stream: an online event needs a link to watch it');
    }
  }
  if (site.archive) {
    errors.push(
      ...ARCHIVE_OFF.filter((feature) => features[feature]).map(
        (feature) => `site.json/features/${feature}: must be off in an archived edition`,
      ),
    );
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
    ['site.json/heroSettings/home/background/image', site.heroSettings?.home?.background?.image],
    ['content/resources.json/aboutOrganizerBlock/image', resources.aboutOrganizerBlock.image],
  ];
  errors.push(...imageErrors(images, paths.public));
  errors.push(...attendingErrors(site, resources.attendingPage, 'content/resources.json', paths));
  errors.push(...iconErrors(site.icon, paths.public));
  // The page inlines it, so it can be drawn in the theme's colors.
  const illustration = site.heroSettings?.home?.illustration;
  const illustrationFile =
    illustration && !isUrl(illustration) ? publicFile(paths.public, illustration) : undefined;
  if (illustration && !illustrationFile) {
    errors.push(`site.json/heroSettings/home/illustration: "${illustration}" ${IN_PUBLIC}`);
  } else if (illustrationFile) {
    const { removed } = sanitizeSvg(fs.readFileSync(illustrationFile, 'utf8'));
    if (removed.length) {
      errors.push(
        `site.json/heroSettings/home/illustration: "${illustration}" has content that could run ` +
          `on the site, which the build would remove: ${[...new Set(removed)].join(', ')}`,
      );
    }
  }
  const customFile = join(paths.site, 'custom.css');
  // Pages inline it in a <style> element, which it must not close.
  if (fs.existsSync(customFile) && /<\/style/i.test(fs.readFileSync(customFile, 'utf8'))) {
    errors.push('custom.css: must not contain "</style"');
  }
  return [
    ...errors,
    ...trackErrors(site),
    ...localeErrors(site, paths.translations),
    ...featureErrors(site, resources),
  ];
};

interface Track {
  id: string;
  title: string;
  days?: string[];
}

const trackErrors = (site: Site): string[] => {
  const tracks = (site.schedule as { tracks?: Track[] }).tracks ?? [];
  const { startDate, endDate } = site.event;
  return tracks.flatMap(({ id, days = [] }, index) => [
    ...(tracks.findIndex((track) => track.id === id) < index
      ? [`site.json/schedule/tracks/${index}/id: "${id}" is the ID of another track`]
      : []),
    ...days.flatMap((day, dayIndex) =>
      day < startDate || day > endDate
        ? [
            `site.json/schedule/tracks/${index}/days/${dayIndex}: "${day}" is not between event.startDate and event.endDate`,
          ]
        : [],
    ),
  ]);
};

// Each key must also be in the site's content/resources.json. Arrays replace, so their items are not checked.
const unknownKeys = (translation: unknown, content: unknown, path: string): string[] =>
  isPlainObject(translation) && isPlainObject(content)
    ? Object.entries(translation).flatMap(([key, value]) =>
        key in content
          ? unknownKeys(value, content[key], `${path}/${key}`)
          : [`${path}/${key}: is not in content/resources.json`],
      )
    : [];

/** Pages whose text is a markdown file in `content/`, which a locale folder can translate. */
export const MARKDOWN_PAGES = ['faq', 'coc'] as const;
export type MarkdownPage = (typeof MARKDOWN_PAGES)[number];
const LOCALE_FILES = ['resources.json', ...MARKDOWN_PAGES.map((page) => `${page}.md`)];

/** Reads `content/locales/<locale>/` for the target locales: `resources.json` and the markdown pages. */
const loadContentTranslations = (
  site: Site,
  siteContent: object,
  resources: Resources,
  validateResources: ValidateFunction,
  paths: ConfigPaths,
): {
  translations: Record<string, object>;
  markdown: Record<string, Partial<Record<MarkdownPage, string>>>;
  errors: string[];
} => {
  const translations: Record<string, object> = {};
  const markdown: Record<string, Partial<Record<MarkdownPage, string>>> = {};
  const errors: string[] = [];
  const dir = join(paths.site, 'content', 'locales');
  if (!fs.existsSync(dir)) return { translations, markdown, errors };

  const { targets } = site.locales as { targets: string[] };
  const folders = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());
  for (const { name: locale } of folders) {
    if (!targets.includes(locale)) {
      errors.push(`content/locales/${locale}: "${locale}" is not in site.json/locales/targets`);
      continue;
    }
    const folder = join(dir, locale);
    const files = fs.readdirSync(folder).filter((name) => !name.startsWith('.'));
    for (const name of files.filter((name) => !LOCALE_FILES.includes(name))) {
      errors.push(
        `content/locales/${locale}/${name}: is not ${new Intl.ListFormat('en', { type: 'disjunction' }).format(LOCALE_FILES)}`,
      );
    }
    const pages = MARKDOWN_PAGES.filter((page) => files.includes(`${page}.md`));
    if (pages.length) {
      markdown[locale] = Object.fromEntries(
        pages.map((page) => [page, join(folder, `${page}.md`)]),
      );
    }

    const file = `content/locales/${locale}/resources.json`;
    if (!files.includes('resources.json')) continue;

    const translation = readSiteJson<unknown>(paths, file);
    if (!isPlainObject(translation)) {
      errors.push(`${file}: must be an object`);
      continue;
    }
    const keyErrors = unknownKeys(translation, siteContent, file);
    if (keyErrors.length) {
      errors.push(...keyErrors);
      continue;
    }
    if (!validateResources(deepMerge(resources, translation))) {
      errors.push(...formatErrors(file, validateResources.errors));
      continue;
    }
    // Only what the translation sets, so the source's errors are not repeated. Arrays replace.
    const { attendingPage } = translation as { attendingPage?: AttendingPage };
    const attending = attendingErrors(site, attendingPage, file, paths);
    if (attending.length) {
      errors.push(...attending);
      continue;
    }
    const content = { ...translation };
    delete content['$schema'];
    translations[locale] = content;
  }
  return { translations, markdown, errors };
};

/**
 * Reads the defaults, then the site's config over them, and validates the result. The dev
 * server, the build and the CLI all use it, so they see the same config.
 */
export const loadConfig = ({ paths = CONFIG_PATHS, nodeEnv = NODE_ENV }: ResolveOptions = {}): {
  config: SiteConfig;
  errors: string[];
  /** Problems that do not stop the build, such as fonts without some characters. */
  warnings: string[];
} => {
  const site = deepMerge(
    readJson<object>(join(paths.defaults, 'site.json')),
    readSiteJson<object>(paths, 'site.json'),
  ) as Site;
  const siteContent = readSiteJson<object>(paths, 'content/resources.json');
  const resources = siteContent as Resources;

  const ajv = new Ajv2020({ allErrors: true });
  // VS Code shows these in site.json, and `hb init` prints them.
  ajv.addKeyword('enumDescriptions');
  const validateSite = ajv.compile(readJson(join(paths.schemas, 'site.schema.json')));
  const validateResources = ajv.compile(readJson(join(paths.schemas, 'resources.schema.json')));
  const siteValid = validateSite(site);
  const resourcesValid = validateResources(resources);
  const errors = [
    ...formatErrors('site.json', validateSite.errors),
    ...formatErrors('content/resources.json', validateResources.errors),
    ...(siteValid && resourcesValid ? crossFileErrors(site, resources, paths) : []),
  ];
  const content =
    siteValid && resourcesValid
      ? loadContentTranslations(site, siteContent, resources, validateResources, paths)
      : { translations: {}, markdown: {}, errors: [] };
  errors.push(...content.errors);

  if (siteValid) {
    site.url ??= `https://${site.firebase.projectId}.web.app/`;
    if (!isUrl(site.image)) site.image = `${site.url}${site.image}`;
  }

  const siteTheme = site.theme as unknown as SiteTheme;
  const theme = resolveTheme(siteTheme);
  // The client reads the scheme from the site config, so it gets the theme's default too.
  siteTheme.colorScheme = theme.colorScheme;
  const warnings: string[] = [];
  if (siteValid) {
    errors.push(...themeErrors(theme));
    if (site.heroSettings?.home?.background) errors.push(...heroPhotoErrors(theme));
    const titles = Object.values(content.translations).map(
      (translation) => (translation as { title?: string }).title ?? '',
    );
    const fonts = fontProblems(siteTheme.fonts, paths.site, [
      resources.title,
      site.shortName,
      ...titles,
    ]);
    errors.push(...fonts.errors);
    warnings.push(...fonts.warnings);
    const tracks = (site.schedule as { tracks?: { stream?: string }[] }).tracks ?? [];
    if (
      site.event.attendance === 'hybrid' &&
      !site.event.stream &&
      !tracks.some(({ stream }) => stream)
    ) {
      warnings.push(
        'site.json/event/stream: a hybrid event has no link to watch it, so people online have nowhere to go',
      );
    }
  }

  return {
    config: {
      site,
      resources,
      theme,
      contentTranslations: content.translations,
      contentMarkdown: content.markdown,
      NODE_ENV: nodeEnv || 'production',
    },
    errors,
    warnings,
  };
};

/** Like `loadConfig`, but throws a `ConfigError` that lists every problem, and logs warnings. */
export const resolveConfig = (options: ResolveOptions = {}): SiteConfig => {
  const { config, errors, warnings } = loadConfig(options);
  if (errors.length) throw new ConfigError(errors);
  for (const warning of warnings) console.warn(`Site config: ${warning}`);
  return config;
};
