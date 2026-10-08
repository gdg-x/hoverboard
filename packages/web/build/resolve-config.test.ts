import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { deepMerge } from '../src/config/merge';
import { FEATURES, type Feature } from '../src/config/features';
import { festival } from '../src/themes/festival';
import { THEMES } from '../src/themes/index';
import { COLOR_ROLES } from '../src/themes/tokens';
import { ConfigError, configPaths, loadConfig, resolveConfig } from './resolve-config';
import {
  buildMarkdown,
  featureDefines,
  heroIllustrationSvg,
  layoutThemeCss,
  markdownTranslations,
  siteModule,
  templateRenderer,
} from './vite-plugin-site';

const repoPaths = configPaths(join(import.meta.dirname, '..'));
const dirsToClean: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const readJson = (path: string): object => JSON.parse(readFileSync(path, 'utf8')) as object;

const writeJson = (path: string, data: unknown) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data));
};

/** The repository's config, with `site` and `resources` merged over the site files. */
const makePaths = ({ site = {}, resources = {} }: { site?: object; resources?: object } = {}) => {
  const root = mkdtempSync(join(tmpdir(), 'hoverboard-config-'));
  dirsToClean.push(root);
  writeJson(
    join(root, 'config/site.json'),
    deepMerge(readJson(join(repoPaths.site, 'site.json')), site),
  );
  writeJson(
    join(root, 'config/content/resources.json'),
    deepMerge(readJson(join(repoPaths.site, 'content/resources.json')), resources),
  );
  return { ...repoPaths, site: join(root, 'config') };
};

describe('resolveConfig', () => {
  it('resolves the repository config', () => {
    const { site, resources } = resolveConfig({ paths: repoPaths, nodeEnv: 'production' });

    expect(site.url).toMatch(/^https:\/\//);
    expect(site.navigation.length).toBeGreaterThan(0);
    expect(resources.title).toBeTruthy();
  });

  it('reads the site.json defaults, then the site config over them, in separate namespaces', () => {
    const { site, resources } = resolveConfig({
      paths: makePaths({
        site: { features: { forkMe: true }, navigation: [] },
        resources: { title: 'My DevFest' },
      }),
      nodeEnv: 'production',
    });

    expect(site.features).toMatchObject({ forkMe: true, blog: true });
    expect(site.navigation).toEqual([]);
    expect(resources.title).toBe('My DevFest');
    expect(site).not.toHaveProperty('title');
  });

  it('has no upstream defaults for content', () => {
    const { resources } = resolveConfig({ paths: repoPaths, nodeEnv: 'production' });

    expect(resources).toEqual(readJson(join(repoPaths.site, 'content/resources.json')));
  });

  it('defaults the URL to the Firebase Hosting address of the project', () => {
    const paths = makePaths({ site: { firebase: { projectId: 'my-devfest' } } });

    const { site } = resolveConfig({ paths, nodeEnv: 'production' });

    expect(site.url).toBe('https://my-devfest.web.app/');
    expect(site.image).toBe('https://my-devfest.web.app/images/social-share.jpg');
  });

  it('keeps a custom domain URL', () => {
    const paths = makePaths({ site: { url: 'https://devfest.example.com/' } });

    expect(resolveConfig({ paths, nodeEnv: 'production' }).site.url).toBe(
      'https://devfest.example.com/',
    );
  });

  it('makes the share image an absolute URL', () => {
    const paths = makePaths({ site: { url: 'https://example.web.app/' } });

    expect(resolveConfig({ paths, nodeEnv: 'production' }).site.image).toBe(
      'https://example.web.app/images/social-share.jpg',
    );
  });

  it('keeps an absolute share image URL', () => {
    const paths = makePaths({ site: { image: 'https://cdn.example.com/share.jpg' } });

    expect(resolveConfig({ paths, nodeEnv: 'production' }).site.image).toBe(
      'https://cdn.example.com/share.jpg',
    );
  });

  it('resolves the same config for development and production builds', () => {
    const development = resolveConfig({ paths: repoPaths, nodeEnv: 'development' });
    const production = resolveConfig({ paths: repoPaths, nodeEnv: 'production' });

    expect(development.site).toEqual(production.site);
    expect(development.resources).toEqual(production.resources);
    expect(development.NODE_ENV).toBe('development');
  });
});

describe('config validation', () => {
  const errorsFor = (overrides: Parameters<typeof makePaths>[0]) =>
    loadConfig({ paths: makePaths(overrides), nodeEnv: 'production' }).errors;

  it('accepts the repository config', () => {
    expect(loadConfig({ paths: repoPaths, nodeEnv: 'production' }).errors).toEqual([]);
  });

  it('reports every error with its file and path', () => {
    expect(
      errorsFor({
        site: { url: 'example.com', typo: true, event: { startDate: '2027-13-01' } },
        resources: { titel: 'DevFest' },
      }),
    ).toEqual([
      'site.json: must NOT have additional properties "typo"',
      'site.json/url: must match pattern "^https?://.+/$"',
      'site.json/event/startDate: must match pattern "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$"',
      'content/resources.json: must NOT have additional properties "titel"',
    ]);
  });

  it('reports missing site values', () => {
    const paths = makePaths();
    const site = readJson(join(paths.site, 'site.json')) as Record<string, unknown>;
    delete site['organizer'];
    writeJson(join(paths.site, 'site.json'), site);

    expect(loadConfig({ paths, nodeEnv: 'production' }).errors).toEqual([
      "site.json: must have required property 'organizer'",
    ]);
  });

  it('rejects an unknown time zone', () => {
    expect(errorsFor({ site: { event: { timezone: 'Europe/Atlantis' } } })).toEqual([
      'site.json/event/timezone: "Europe/Atlantis" is not a known time zone',
    ]);
    expect(errorsFor({ site: { event: { timezone: '+03:00' } } })).toEqual([
      'site.json/event/timezone: must match pattern "^[A-Za-z_]+(/[A-Za-z0-9_+-]+)*$"',
    ]);
  });

  it('requires a valid Firebase project ID', () => {
    const paths = makePaths();
    const site = readJson(join(paths.site, 'site.json')) as Record<string, unknown>;
    delete site['firebase'];
    writeJson(join(paths.site, 'site.json'), site);

    expect(loadConfig({ paths, nodeEnv: 'production' }).errors).toEqual([
      "site.json: must have required property 'firebase'",
    ]);
    expect(errorsFor({ site: { firebase: { projectId: 'My Project' } } })).toEqual([
      'site.json/firebase/projectId: must match pattern "^[a-z][a-z0-9-]{4,28}[a-z0-9]$"',
    ]);
  });

  it('rejects colors that are not hex colors', () => {
    expect(errorsFor({ site: { theme: { tagColors: { web: 'red; } body {' } } } })).toEqual([
      'site.json/theme/tagColors/web: must match pattern "^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$"',
    ]);
  });

  it('rejects unknown sign-in providers', () => {
    expect(errorsFor({ site: { auth: { providers: ['myspace'] } } })).toEqual([
      'site.json/auth/providers/0: must be equal to one of the allowed values',
    ]);
  });

  it('rejects navigation to unknown routes', () => {
    expect(
      errorsFor({
        site: { navigation: [{ route: 'sponsors', permalink: '/sponsors' }] },
      }),
    ).toEqual(['site.json/navigation/0/route: "sponsors" is not home or a feature with a page']);
  });

  it('rejects navigation to a feature without a page', () => {
    expect(
      errorsFor({
        site: { navigation: [{ route: 'gallery', permalink: '/#gallery' }] },
      }),
    ).toEqual(['site.json/navigation/0/route: "gallery" is not home or a feature with a page']);
  });

  it('rejects images that do not exist', () => {
    expect(errorsFor({ site: { image: 'images/missing.jpg' } })).toEqual([
      'site.json/image: "images/missing.jpg" is not in packages/web/public',
    ]);
  });

  it('rejects a hero illustration that is not an SVG in packages/web/public', () => {
    expect(
      errorsFor({ site: { heroSettings: { home: { illustration: '/images/missing.svg' } } } }),
    ).toEqual([
      'site.json/heroSettings/home/illustration: "/images/missing.svg" is not in packages/web/public',
    ]);
    expect(
      errorsFor({
        site: { heroSettings: { home: { illustration: 'https://example.com/city.svg' } } },
      }),
    ).toEqual([
      'site.json/heroSettings/home/illustration: "https://example.com/city.svg" is not in packages/web/public',
    ]);
    expect(
      errorsFor({ site: { heroSettings: { home: { illustration: '/images/logo.png' } } } }),
    ).toEqual(['site.json/heroSettings/home/illustration: must match pattern "\\.svg$"']);
  });

  it('checks the hero text over a photo against the scrim', () => {
    const photo = {
      heroSettings: { home: { background: { image: '/images/backgrounds/home.jpg' } } },
    };

    expect(errorsFor({ site: photo })).toEqual([]);
    expect(
      errorsFor({ site: { ...photo, theme: { darkColors: { scrim: '#00000033' } } } }),
    ).toEqual([
      'site.json/heroSettings/home/background: onSurface on the scrim over a white photo has a contrast of 1.40:1 in the dark scheme, and needs 4.5:1. Make theme.darkColors.scrim darker.',
    ]);
  });

  it('takes hero descriptions from content/resources.json, not site.json', () => {
    expect(
      errorsFor({
        site: { heroSettings: { home: { description: 'Welcome' } } },
        resources: { heroDescriptions: { teams: 'Organizers' } },
      }),
    ).toEqual([
      'site.json/heroSettings/home: must NOT have additional properties "description"',
      'content/resources.json/heroDescriptions: must NOT have additional properties "teams"',
    ]);
  });

  it('defaults to English only', () => {
    const { site } = resolveConfig({ paths: repoPaths, nodeEnv: 'production' });

    expect(site.locales).toEqual({ source: 'en', targets: [] });
  });

  it('requires UI translations for every locale other than en', () => {
    expect(errorsFor({ site: { locales: { source: 'es', targets: ['en', 'pt-BR'] } } })).toEqual([
      'site.json/locales: "es" has no UI translations in packages/translations/xliff',
      'site.json/locales: "pt-BR" has no UI translations in packages/translations/xliff',
    ]);
  });

  it('accepts locales that have UI translations', () => {
    const translations = mkdtempSync(join(tmpdir(), 'hoverboard-translations-'));
    dirsToClean.push(translations);
    writeJson(join(translations, 'xliff/es.xlf'), '');
    const paths = {
      ...makePaths({ site: { locales: { source: 'es', targets: ['en'] } } }),
      translations,
    };

    expect(loadConfig({ paths, nodeEnv: 'production' }).errors).toEqual([]);
  });

  it('rejects the source locale in the targets', () => {
    expect(errorsFor({ site: { locales: { source: 'en', targets: ['en'] } } })).toEqual([
      'site.json/locales/targets: includes the source locale "en"',
    ]);
  });

  it('rejects locale codes that are not BCP 47', () => {
    expect(errorsFor({ site: { locales: { source: 'en', targets: ['../es'] } } })).toEqual([
      'site.json/locales/targets/0: must match pattern "^[a-z]{2,3}(-[A-Z][a-z]{3})?(-([A-Z]{2}|\\d{3}))?$"',
    ]);
  });

  describe('event content translations', () => {
    /** A site with `es` as a target, its UI translations, and `content/locales/es/resources.json`. */
    const spanishSite = (
      translation?: unknown,
      site: object = {},
      files: Record<string, string> = {},
    ) => {
      const translations = mkdtempSync(join(tmpdir(), 'hoverboard-translations-'));
      dirsToClean.push(translations);
      writeJson(join(translations, 'xliff/es.xlf'), '');
      const paths = {
        ...makePaths({ site: { locales: { source: 'en', targets: ['es'] }, ...site } }),
        translations,
      };
      if (translation !== undefined) {
        writeJson(join(paths.site, 'content/locales/es/resources.json'), translation);
      }
      for (const [name, text] of Object.entries(files)) {
        mkdirSync(join(paths.site, 'content/locales/es'), { recursive: true });
        writeFileSync(join(paths.site, 'content/locales/es', name), text);
      }
      return { ...loadConfig({ paths, nodeEnv: 'production' }), paths };
    };

    it('has none for the repository config', () => {
      expect(
        loadConfig({ paths: repoPaths, nodeEnv: 'production' }).config.contentTranslations,
      ).toEqual({});
    });

    it('reads the translated keys of each target locale, without $schema', () => {
      const { config, errors } = spanishSite({
        $schema: '../../../../web/schemas/resources.schema.json',
        title: 'DevFest en español',
        aboutBlock: { statisticsBlock: { days: { label: 'Días' } } },
      });

      expect(errors).toEqual([]);
      expect(config.contentTranslations).toEqual({
        es: {
          title: 'DevFest en español',
          aboutBlock: { statisticsBlock: { days: { label: 'Días' } } },
        },
      });
    });

    it('allows a target locale without content translations', () => {
      const { config, errors } = spanishSite();

      expect(errors).toEqual([]);
      expect(config.contentTranslations).toEqual({});
    });

    it('rejects keys that are not in content/resources.json', () => {
      expect(
        spanishSite({ titel: 'DevFest', aboutBlock: { heading: 'Acerca' }, faq: '/x.md' }).errors,
      ).toEqual([
        'content/locales/es/resources.json/titel: is not in content/resources.json',
        'content/locales/es/resources.json/aboutBlock/heading: is not in content/resources.json',
        'content/locales/es/resources.json/faq: is not in content/resources.json',
      ]);
    });

    it('rejects values the schema does not allow', () => {
      expect(spanishSite({ title: 5 }).errors).toEqual([
        'content/locales/es/resources.json/title: must be string',
      ]);
    });

    it('rejects a file that is not an object', () => {
      expect(spanishSite(['DevFest']).errors).toEqual([
        'content/locales/es/resources.json: must be an object',
      ]);
    });

    it('rejects a locale folder that is not a target', () => {
      expect(
        spanishSite({ title: 'DevFest' }, { locales: { source: 'en', targets: [] } }).errors,
      ).toEqual(['content/locales/es: "es" is not in site.json/locales/targets']);
    });

    it('lists the translated markdown pages of each locale', () => {
      const { config, errors, paths } = spanishSite(
        undefined,
        {},
        {
          'faq.md': '# Preguntas',
          '.DS_Store': '',
        },
      );

      expect(errors).toEqual([]);
      expect(config.contentMarkdown).toEqual({
        es: { faq: join(paths.site, 'content/locales/es/faq.md') },
      });
      expect(config.contentTranslations).toEqual({});
    });

    it('rejects other files in a locale folder', () => {
      expect(spanishSite(undefined, {}, { 'FAQ.md': '# Preguntas' }).errors).toEqual([
        'content/locales/es/FAQ.md: is not resources.json, faq.md, or coc.md',
      ]);
    });
  });

  it('rejects unknown features', () => {
    expect(errorsFor({ site: { features: { sponsors: true } } })).toEqual([
      'site.json/features: must NOT have additional properties "sponsors"',
    ]);
  });

  it('rejects features whose required features are off', () => {
    expect(errorsFor({ site: { features: { schedule: false } } })).toEqual([
      'site.json/features/feedback: needs schedule, which is off',
      'site.json/features/mySchedule: needs schedule, which is off',
    ]);
  });

  it('accepts the map without a Google Maps key, which then shows only directions', () => {
    const paths = makePaths();
    const site = readJson(join(paths.site, 'site.json')) as Record<string, unknown>;
    delete site['integrations'];
    writeJson(join(paths.site, 'site.json'), site);

    expect(loadConfig({ paths, nodeEnv: 'production' }).errors).toEqual([]);
  });

  it('rejects content links to features that are off', () => {
    expect(errorsFor({ site: { features: { faq: false, team: false } } })).toEqual([
      'content/resources.json/footerRelBlock/2/links/4/url: "/faq" links to faq, which is off',
      'content/resources.json/aboutOrganizerBlock/blocks/0/callToAction/link: "/team" links to team, which is off',
    ]);
  });

  it('lists every feature in the schema', () => {
    const schema = readJson(join(repoPaths.schemas, 'site.schema.json')) as {
      properties: { features: { properties: object } };
    };

    expect(Object.keys(schema.properties.features.properties)).toEqual([...FEATURES]);
  });

  it('names the file with invalid JSON', () => {
    const paths = makePaths();
    writeFileSync(join(paths.site, 'content/resources.json'), '{\n  "title": "DevFest",\n}\n');

    expect(() => loadConfig({ paths, nodeEnv: 'production' })).toThrow(ConfigError);
    expect(() => loadConfig({ paths, nodeEnv: 'production' })).toThrow(
      /content\/resources\.json: is not valid JSON\. .*\(line 3 column 1\)/,
    );
  });

  it('fails the build with every error', () => {
    const paths = makePaths({ site: { typo: true }, resources: { titel: 'DevFest' } });

    expect(() => resolveConfig({ paths, nodeEnv: 'production' })).toThrow(ConfigError);
    expect(() => resolveConfig({ paths, nodeEnv: 'production' })).toThrow(/typo[\s\S]*titel/);
  });
});

describe('featureDefines', () => {
  it('defines each flag as a literal, and the object for dynamic lookups', () => {
    const features = Object.fromEntries(
      FEATURES.map((feature) => [feature, feature !== 'blog']),
    ) as Record<Feature, boolean>;

    const defines = featureDefines(features);

    expect(defines['__HB_FEATURES__.blog']).toBe('false');
    expect(defines['__HB_FEATURES__.team']).toBe('true');
    expect(JSON.parse(defines['__HB_FEATURES__'] ?? '')).toEqual(features);
  });
});

describe('markdownTranslations', () => {
  it('renders each translated page into a hashed file and points the translation at it', () => {
    const dir = mkdtempSync(join(tmpdir(), 'hoverboard-markdown-'));
    dirsToClean.push(dir);
    writeFileSync(join(dir, 'faq.md'), '# Preguntas de {{ name }}');
    const config = {
      ...resolveConfig({ paths: repoPaths, nodeEnv: 'production' }),
      contentTranslations: { es: { title: 'DevFest en español' } },
      contentMarkdown: { es: { faq: join(dir, 'faq.md') } },
    };

    const { files, contentTranslations } = markdownTranslations(config, (template) =>
      template.replace('{{ name }}', 'DevFest'),
    );

    expect(files).toEqual([
      {
        fileName: expect.stringMatching(/^locales\/es-faq-[0-9a-f]{8}\.md$/),
        source: '# Preguntas de DevFest',
      },
    ]);
    expect(contentTranslations).toEqual({
      es: { title: 'DevFest en español', faq: `/${files[0]!.fileName}` },
    });
    expect(config.contentTranslations).toEqual({ es: { title: 'DevFest en español' } });
  });
});

describe('buildMarkdown', () => {
  it('renders the markdown pages with the site config and reads the posts', () => {
    const { pages, posts } = buildMarkdown(repoPaths.site, (template) =>
      template.replaceAll('{{', '[').replaceAll('}}', ']'),
    );

    expect(Object.keys(pages)).toEqual(['faq', 'coc']);
    expect(pages.faq).not.toContain('{{');
    expect(Object.keys(posts)).toContain('2017-02-12-c4p.md');
  });

  it('skips markdown that a site does not have', () => {
    const dir = mkdtempSync(join(tmpdir(), 'hoverboard-markdown-'));
    dirsToClean.push(dir);

    expect(buildMarkdown(dir, (template) => template)).toEqual({ pages: {}, posts: {} });
  });
});

describe('templateRenderer', () => {
  it('renders the site config into a template', () => {
    const config = resolveConfig({ paths: repoPaths, nodeEnv: 'production' });
    const site = { ...config.site, locales: { source: 'es', targets: [] } };

    expect(templateRenderer({ ...config, site })('{{ site.locales.source }}')).toBe('es');
  });
});

describe('siteModule', () => {
  const config = {
    ...resolveConfig({ paths: repoPaths, nodeEnv: 'production' }),
    contentTranslations: { es: { title: 'DevFest en español' } },
  };
  const plugin = siteModule(config, { siteDir: repoPaths.site });
  const resolveId = plugin.resolveId as (id: string) => string | undefined;
  const load = plugin.load as (id: string) => Promise<string | undefined>;

  it('lazy-loads each content translation from its own module', async () => {
    const code = (await load(resolveId('virtual:hoverboard/site')!))!;

    expect(code).toContain(`export const resources = ${JSON.stringify(config.resources)};`);
    expect(code).toContain(
      'export const contentTranslations = {"es": () => import("virtual:hoverboard/content/es")};',
    );
    expect(code).toContain('export const heroIllustration = undefined;');
    expect(await load(resolveId('virtual:hoverboard/content/es')!)).toBe(
      'export default {"title":"DevFest en español"};\n',
    );
  });

  it('resolves only the locales that have a translation', () => {
    expect(resolveId('virtual:hoverboard/content/fr')).toBeUndefined();
    expect(resolveId('virtual:hoverboard/content/constructor')).toBeUndefined();
  });

  it('serves the theme and head data to the layout', async () => {
    const code = (await load(resolveId('virtual:hoverboard/layout')!))!;

    expect(code).toContain(`export const theme = ${JSON.stringify(config.theme)};`);
    expect(code).toContain(`export const themeCss = ${JSON.stringify(layoutThemeCss(config))};`);
  });

  it('serves the theme fonts with imported file URLs', async () => {
    const code = (await load(resolveId('virtual:hoverboard/fonts')!))!;

    expect(code).toContain(
      'import font0 from "@fontsource-variable/unbounded/files/unbounded-cyrillic-ext-wght-normal.woff2?url&no-inline";',
    );
    expect(code).toContain(
      '--hb-font-display:\\"Unbounded Variable\\", \\"Unbounded Variable Fallback\\", Arial, sans-serif;',
    );
    expect(code).toContain('export const fontStylesheets = [];');
  });
});

describe('heroIllustrationSvg', () => {
  const siteWith = (illustration?: string) =>
    ({ heroSettings: { home: { illustration } } }) as unknown as Parameters<
      typeof heroIllustrationSvg
    >[0];

  it('reads the SVG from packages/web/public without its XML declaration', () => {
    const publicDir = mkdtempSync(join(tmpdir(), 'hoverboard-public-'));
    dirsToClean.push(publicDir);
    mkdirSync(join(publicDir, 'images'));
    writeFileSync(
      join(publicDir, 'images/city.svg'),
      '<?xml version="1.0"?>\n<svg viewBox="0 0 1 1"></svg>\n',
    );

    expect(heroIllustrationSvg(siteWith('/images/city.svg'), publicDir)).toBe(
      '<svg viewBox="0 0 1 1"></svg>',
    );
  });

  it('is undefined without an illustration', () => {
    expect(heroIllustrationSvg(siteWith())).toBeUndefined();
  });
});

describe('layoutThemeCss', () => {
  it('writes the theme with the badge and tag colors', () => {
    const config = resolveConfig({ paths: repoPaths, nodeEnv: 'production' });

    const css = layoutThemeCss(config);

    expect(css).toContain(
      `--hb-color-primary: light-dark(${festival.light.primary}, ${festival.dark.primary});`,
    );
    expect(css).toContain('--gde: #3d5afe;');
    expect(css).toContain(`--android: ${config.site.theme.tagColors.android};`);
  });
});

describe('theme', () => {
  it('uses the festival theme, following the system color scheme', () => {
    const { theme } = resolveConfig({ paths: repoPaths, nodeEnv: 'production' });

    expect(theme).toMatchObject({
      name: 'festival',
      colorScheme: 'system',
      density: 'default',
      decorations: true,
      light: festival.light,
      dark: festival.dark,
    });
  });

  it('overrides colors of the theme', () => {
    const paths = makePaths({
      site: { theme: { colors: { primary: '#c2185b' }, darkColors: { primary: '#ff8fb8' } } },
    });

    const { theme } = resolveConfig({ paths, nodeEnv: 'production' });

    expect(theme.light.primary).toBe('#c2185b');
    expect(theme.dark.primary).toBe('#ff8fb8');
  });

  it('rejects unknown themes, settings and colors', () => {
    const paths = makePaths({
      site: {
        theme: {
          name: 'default',
          colorScheme: 'auto',
          density: 'tight',
          colors: { brand: '#000000', primary: '#3557e680' },
        },
      },
    });

    expect(loadConfig({ paths, nodeEnv: 'production' }).errors).toEqual([
      'site.json/theme/name: must be equal to one of the allowed values',
      'site.json/theme/colorScheme: must be equal to one of the allowed values',
      'site.json/theme/density: must be equal to one of the allowed values',
      'site.json/theme/colors: must NOT have additional properties "brand"',
      'site.json/theme/colors/primary: must match pattern "^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$"',
    ]);
  });

  it('rejects colors with too little contrast in the schemes the site uses', () => {
    const errorsFor = (theme: object) =>
      loadConfig({ paths: makePaths({ site: { theme } }), nodeEnv: 'production' }).errors;

    expect(errorsFor({ darkColors: { onPrimary: '#ffffff' } })).toEqual([
      'site.json/theme: onPrimary on primary has a contrast of 2.02:1 in the dark scheme, and needs 4.5:1. Change theme.darkColors.',
    ]);
    expect(errorsFor({ colorScheme: 'light', darkColors: { onPrimary: '#ffffff' } })).toEqual([]);
  });

  it('lists every theme and color in the schema', () => {
    const schema = readJson(join(repoPaths.schemas, 'site.schema.json')) as {
      properties: { theme: { properties: { name: { enum: string[] } } } };
      $defs: { themeColors: { properties: object } };
    };

    expect(schema.properties.theme.properties.name.enum).toEqual(Object.keys(THEMES));
    expect(Object.keys(schema.$defs.themeColors.properties)).toEqual([...COLOR_ROLES]);
  });
});
