import n from 'nunjucks';
import type { PluginOption } from 'vite';
import copy from 'rollup-plugin-copy';
import { resolveConfig, type SiteConfig } from './resolve-config';

// Tag names come from session data, so their colors are site config, not theme code.
export const themeColorsCss = ({ site }: SiteConfig): string => {
  const colors = { ...site.theme.badgeColors, ...site.theme.tagColors };
  const properties = Object.entries(colors).map(([name, color]) => `--${name}: ${color};`);
  return `:root { ${properties.join(' ')} }`;
};

// Renders the Nunjucks placeholders (e.g. {{ resources.title }}) in index.html, manifest.json and
// the markdown pages with the resolved site config.
export const site = (): PluginOption[] => {
  const data = resolveConfig();
  const nunjucks = n.configure({ throwOnUndefined: true });
  const compileTemplate = (template: string) => nunjucks.renderString(template, data);
  const compileBufferTemplate = (body: Buffer) => compileTemplate(body.toString());

  return [
    {
      name: 'hoverboard-template-html',
      // `pre` so Vite's own HTML parsing (module script discovery, asset href resolution)
      // sees the final, already-rendered markup.
      transformIndexHtml: {
        order: 'pre',
        handler: (html) => ({
          html: compileTemplate(html),
          tags: [{ tag: 'style', children: themeColorsCss(data), injectTo: 'head' }],
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
