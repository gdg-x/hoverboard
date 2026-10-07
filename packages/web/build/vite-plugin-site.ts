import n from 'nunjucks';
import type { HtmlTagDescriptor, Plugin, PluginOption } from 'vite';
import copy from 'rollup-plugin-copy';
import { FEATURES, type Feature } from '../src/config/features';
import { THEME_TOKENS, type ThemeToken } from '../src/themes/tokens';
import { resolveConfig, type SiteConfig } from './resolve-config';

export const SITE_MODULE = 'virtual:hoverboard/site';
const RESOLVED_SITE_MODULE = `\0${SITE_MODULE}`;

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
 * Tests pass `defineFeatures: false` and set `globalThis.__HB_FEATURES__` so they can toggle flags.
 */
export const siteModule = (
  { site, resources }: SiteConfig,
  { defineFeatures = true } = {},
): Plugin => ({
  name: 'hoverboard-site-module',
  config: () => (defineFeatures ? { define: featureDefines(site.features) } : {}),
  resolveId: (id) => (id === SITE_MODULE ? RESOLVED_SITE_MODULE : undefined),
  load: (id) =>
    id === RESOLVED_SITE_MODULE
      ? `export const site = ${JSON.stringify(site)};\nexport const resources = ${JSON.stringify(resources)};\n`
      : undefined,
});

/**
 * The theme tokens, and the badge and tag colors, as CSS variables on `:root`, so the first paint
 * is themed. Tag names come from session data, so their colors are site config.
 */
export const themeColorsCss = ({ site, theme }: SiteConfig): string => {
  const tokens = Object.entries(theme).map(
    ([token, color]) => [THEME_TOKENS[token as ThemeToken], color] as const,
  );
  const named = Object.entries({ ...site.theme.badgeColors, ...site.theme.tagColors }).map(
    ([name, color]) => [`--${name}`, color] as const,
  );
  const properties = [...tokens, ...named].map(([property, color]) => `${property}: ${color};`);
  return `:root { ${properties.join(' ')} }`;
};

export const headTags = (data: SiteConfig): HtmlTagDescriptor[] => {
  const tags: HtmlTagDescriptor[] = [
    { tag: 'style', children: themeColorsCss(data), injectTo: 'head' },
  ];
  const key = data.site.integrations?.googleMapsApiKey;
  if (data.site.features.map && key) {
    const query = new URLSearchParams({
      key,
      libraries: 'maps,marker',
      loading: 'async',
      v: 'beta',
    });
    tags.push({
      tag: 'script',
      attrs: { async: true, defer: true, src: `https://maps.googleapis.com/maps/api/js?${query}` },
      injectTo: 'head',
    });
  }
  return tags;
};

// Renders the Nunjucks placeholders (e.g. {{ resources.title }}) in index.html, manifest.json and
// the markdown pages with the resolved site config.
export const site = (): PluginOption[] => {
  const data = resolveConfig();
  const nunjucks = n.configure({ throwOnUndefined: true });
  const compileTemplate = (template: string) => nunjucks.renderString(template, data);
  const compileBufferTemplate = (body: Buffer) => compileTemplate(body.toString());

  return [
    siteModule(data),
    {
      name: 'hoverboard-template-html',
      // `pre` so Vite's own HTML parsing (module script discovery, asset href resolution)
      // sees the final, already-rendered markup.
      transformIndexHtml: {
        order: 'pre',
        handler: (html) => ({
          html: compileTemplate(html),
          tags: headTags(data),
        }),
      },
    },
    copy({
      // Runs after Vite's own public/ copy (which happens during the write phase) so these
      // overwrite the raw copies with their rendered versions.
      hook: 'writeBundle',
      targets: [
        { src: 'public/manifest.json', dest: 'dist', transform: compileBufferTemplate },
        { src: '../config/content/*.md', dest: 'dist/data', transform: compileBufferTemplate },
        { src: '../config/content/posts/*.md', dest: 'dist/data/posts' },
      ],
    }),
  ];
};
