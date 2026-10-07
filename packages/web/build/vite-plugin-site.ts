import n from 'nunjucks';
import type { PluginOption } from 'vite';
import copy from 'rollup-plugin-copy';
import { resolveConfig } from './resolve-config';

// Renders the Nunjucks placeholders (e.g. {{ title }}) in index.html, manifest.json and the
// markdown pages with the resolved site config.
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
        handler: (html) => compileTemplate(html),
      },
    },
    copy({
      // Runs after Vite's own public/ copy (which happens during the write phase) so these
      // overwrite the raw copies with their rendered versions.
      hook: 'writeBundle',
      targets: [
        { src: 'public/manifest.json', dest: 'dist', transform: compileBufferTemplate },
        { src: 'public/data/*.md', dest: 'dist/data', transform: compileBufferTemplate },
      ],
    }),
  ];
};
