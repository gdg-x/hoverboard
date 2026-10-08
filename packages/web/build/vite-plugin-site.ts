import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { join } from 'node:path';
import n from 'nunjucks';
import type { Plugin, PluginOption } from 'vite';
import copy from 'rollup-plugin-copy';
import { FEATURES, type Feature } from '../src/config/features';
import { fontModuleCode, fontModuleParts } from './fonts';
import {
  CONFIG_PATHS,
  MARKDOWN_PAGES,
  type MarkdownPage,
  resolveConfig,
  type SiteConfig,
} from './resolve-config';
import { darkLogoCss, type SiteTheme, themeCss } from './theme';

export const SITE_MODULE = 'virtual:hoverboard/site';
const RESOLVED_SITE_MODULE = `\0${SITE_MODULE}`;
// What the layout needs beyond the client config. Only `.astro` files import it.
export const LAYOUT_MODULE = 'virtual:hoverboard/layout';
const RESOLVED_LAYOUT_MODULE = `\0${LAYOUT_MODULE}`;
// The theme's `@font-face` rules and font variables. Only `.astro` files import it.
export const FONTS_MODULE = 'virtual:hoverboard/fonts';
const RESOLVED_FONTS_MODULE = `\0${FONTS_MODULE}`;
// One module per locale, `virtual:hoverboard/content/<locale>`, so each is its own chunk.
export const CONTENT_MODULE = 'virtual:hoverboard/content/';
const RESOLVED_CONTENT_MODULE = `\0${CONTENT_MODULE}`;
// The markdown that pages render at build time. Only server code imports it.
export const MARKDOWN_MODULE = 'virtual:hoverboard/markdown';
const RESOLVED_MARKDOWN_MODULE = `\0${MARKDOWN_MODULE}`;

/**
 * Feature flags as literals, for example `__HB_FEATURES__.blog` becomes `false`, so the bundler
 * drops the code and `import()` calls of disabled features. The whole object serves dynamic lookups.
 */
export const featureDefines = (features: Record<Feature, boolean>): Record<string, string> => ({
  __HB_FEATURES__: JSON.stringify(features),
  ...Object.fromEntries(
    FEATURES.map((feature) => [`__HB_FEATURES__.${feature}`, JSON.stringify(features[feature])]),
  ),
});

/**
 * Serves the resolved config as `virtual:hoverboard/site`, the client's only source of config.
 * `contentTranslations` lazy-loads each locale's event content translation.
 * Tests pass `defineFeatures: false` and set `globalThis.__HB_FEATURES__` so they can toggle flags.
 */
export const siteModule = (
  config: SiteConfig,
  { defineFeatures = true, siteDir = CONFIG_PATHS.site } = {},
): Plugin => ({
  name: 'hoverboard-site-module',
  config: () => (defineFeatures ? { define: featureDefines(config.site.features) } : {}),
  resolveId: (id) => {
    if (id === SITE_MODULE) return RESOLVED_SITE_MODULE;
    if (id === LAYOUT_MODULE) return RESOLVED_LAYOUT_MODULE;
    if (id === FONTS_MODULE) return RESOLVED_FONTS_MODULE;
    const locale = id.startsWith(CONTENT_MODULE) ? id.slice(CONTENT_MODULE.length) : undefined;
    return locale && Object.hasOwn(config.contentTranslations, locale)
      ? `${RESOLVED_CONTENT_MODULE}${locale}`
      : undefined;
  },
  load: async (id) => {
    const { site, resources, contentTranslations } = config;
    if (id === RESOLVED_SITE_MODULE) {
      const loaders = Object.keys(contentTranslations).map(
        (locale) =>
          `${JSON.stringify(locale)}: () => import(${JSON.stringify(`${CONTENT_MODULE}${locale}`)})`,
      );
      return [
        `export const site = ${JSON.stringify(site)};`,
        `export const resources = ${JSON.stringify(resources)};`,
        `export const contentTranslations = {${loaders.join(', ')}};`,
        '',
      ].join('\n');
    }
    if (id === RESOLVED_LAYOUT_MODULE) {
      return [
        `export const theme = ${JSON.stringify(config.theme)};`,
        `export const themeCss = ${JSON.stringify(layoutThemeCss(config))};`,
        `export const mapsScript = ${JSON.stringify(mapsScriptSrc(config))};`,
        '',
      ].join('\n');
    }
    if (id === RESOLVED_FONTS_MODULE) {
      const siteTheme = site.theme as unknown as SiteTheme;
      return fontModuleCode(await fontModuleParts(config.theme.fonts, siteTheme.fonts, siteDir));
    }
    if (id.startsWith(RESOLVED_CONTENT_MODULE)) {
      const locale = id.slice(RESOLVED_CONTENT_MODULE.length);
      return `export default ${JSON.stringify(contentTranslations[locale])};\n`;
    }
    return undefined;
  },
});

/**
 * The theme tokens, the badge and tag colors, and the dark logo, as CSS variables on `:root`, so
 * the first paint is themed. Tag names come from session data, so their colors are site config.
 */
export const layoutThemeCss = ({ site, theme }: SiteConfig): string =>
  [
    themeCss(theme, { ...site.theme.badgeColors, ...site.theme.tagColors }),
    darkLogoCss(fs.existsSync(join(CONFIG_PATHS.public, 'images/logo-dark.svg'))),
  ].join('\n');

/** The Google Maps script, when the map is on and the site has a key. */
export const mapsScriptSrc = (data: SiteConfig): string | undefined => {
  const key = data.site.integrations?.googleMapsApiKey;
  if (!data.site.features.map || !key) return undefined;
  const query = new URLSearchParams({
    key,
    libraries: 'maps,marker',
    loading: 'async',
    v: 'beta',
  });
  return `https://maps.googleapis.com/maps/api/js?${query}`;
};

/**
 * Renders each translated markdown page into `locales/<locale>-<page>-<hash>.md`, and sets the
 * page's path (the `faq` or `coc` key) in that locale's content translation. The hash lets the
 * service worker cache the file on first load, like the locale modules.
 */
export const markdownTranslations = (
  { contentTranslations, contentMarkdown }: SiteConfig,
  render: (template: string) => string,
): {
  files: { fileName: string; source: string }[];
  contentTranslations: Record<string, object>;
} => {
  const files: { fileName: string; source: string }[] = [];
  const translations = { ...contentTranslations };
  for (const [locale, pages] of Object.entries(contentMarkdown)) {
    for (const [page, path] of Object.entries(pages)) {
      const source = render(fs.readFileSync(path, 'utf8'));
      const hash = createHash('sha256').update(source).digest('hex').slice(0, 8);
      const fileName = `locales/${locale}-${page}-${hash}.md`;
      files.push({ fileName, source });
      translations[locale] = { ...translations[locale], [page]: `/${fileName}` };
    }
  }
  return { files, contentTranslations: translations };
};

/** Renders Nunjucks placeholders (e.g. {{ resources.title }}) with the resolved site config. */
export const templateRenderer = (data: SiteConfig) => {
  const nunjucks = n.configure({ throwOnUndefined: true });
  return (template: string) => nunjucks.renderString(template, data);
};

export interface BuildMarkdown {
  /** `content/faq.md` and `content/coc.md`, rendered with the site config, as the build copies them. */
  pages: Partial<Record<MarkdownPage, string>>;
  /** `content/posts/*.md` by file name. */
  posts: Record<string, string>;
}

/** The site's markdown in the source locale, for pages to render at build time. */
export const buildMarkdown = (
  siteDir: string,
  render: (template: string) => string,
): BuildMarkdown => {
  const read = (path: string) => fs.readFileSync(path, 'utf8');
  const pages = MARKDOWN_PAGES.flatMap((page) => {
    const path = join(siteDir, 'content', `${page}.md`);
    return fs.existsSync(path) ? [[page, render(read(path))]] : [];
  });
  const postsDir = join(siteDir, 'content', 'posts');
  const posts = fs.existsSync(postsDir)
    ? fs
        .readdirSync(postsDir)
        .filter((file) => file.endsWith('.md'))
        .map((file) => [file, read(join(postsDir, file))])
    : [];
  return { pages: Object.fromEntries(pages), posts: Object.fromEntries(posts) };
};

const markdownModule = (markdown: BuildMarkdown): Plugin => ({
  name: 'hoverboard-markdown-module',
  resolveId: (id) => (id === MARKDOWN_MODULE ? RESOLVED_MARKDOWN_MODULE : undefined),
  load: (id) =>
    id === RESOLVED_MARKDOWN_MODULE
      ? `export const pages = ${JSON.stringify(markdown.pages)};\n` +
        `export const posts = ${JSON.stringify(markdown.posts)};\n`
      : undefined,
});

// Astro builds for the server and then the client. Files go out once, with the client build.
const clientOnly = <P extends object>(plugin: P): P & Pick<Plugin, 'applyToEnvironment'> => ({
  ...plugin,
  applyToEnvironment: (environment) => environment.config.consumer === 'client',
});

// Serves the site config, and renders the markdown pages with it.
export const site = (data: SiteConfig = resolveConfig()): PluginOption[] => {
  const compileTemplate = templateRenderer(data);
  const compileBufferTemplate = (body: Buffer) => compileTemplate(body.toString());
  const markdown = markdownTranslations(data, compileTemplate);

  return [
    siteModule({ ...data, contentTranslations: markdown.contentTranslations }),
    markdownModule(buildMarkdown(CONFIG_PATHS.site, compileTemplate)),
    clientOnly<Plugin>({
      name: 'hoverboard-localized-markdown',
      generateBundle() {
        for (const { fileName, source } of markdown.files) {
          this.emitFile({ type: 'asset', fileName, source });
        }
      },
    }),
    clientOnly(
      copy({
        hook: 'writeBundle',
        targets: [
          { src: '../config/content/*.md', dest: 'dist/data', transform: compileBufferTemplate },
          { src: '../config/content/posts/*.md', dest: 'dist/data/posts' },
        ],
      }),
    ),
  ];
};
