import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import copy from 'rollup-plugin-copy';
import livereload from 'rollup-plugin-livereload';
import { generateSW } from 'rollup-plugin-workbox';
import { compileBufferTemplate, compileTemplate, production, watch } from './utils/build';
import { workboxConfig } from './workbox.config';

// index.html contains Nunjucks placeholders (e.g. {{ title }}) that need to be
// rendered with the same config/resource data used for manifest.json and the
// markdown pages below. Runs as an `order: 'pre'` transform so Vite's own HTML
// parsing (module script discovery, asset href resolution) sees the final,
// already-rendered markup.
const templateHtml = (): Plugin => ({
  name: 'hoverboard-template-html',
  transformIndexHtml: {
    order: 'pre',
    handler: (html) => compileTemplate(html),
  },
});

export default defineConfig({
  build: {
    // `npm run clean` empties dist/ before either the app or the service
    // worker build runs; letting Vite empty it too would race with (and
    // could delete) whichever of the two builds finished first.
    emptyOutDir: false,
    outDir: 'dist',
    sourcemap: production,
    minify: production,
    target: 'es2019',
    rollupOptions: {
      treeshake: production,
      output: {
        entryFileNames: production ? '[name]-[hash].js' : '[name].js',
        chunkFileNames: production ? '[name]-[hash].js' : '[name].js',
      },
    },
  },
  plugins: [
    templateHtml(),
    copy({
      // Runs after Vite's own public/ copy (which happens during the
      // write phase) so these overwrite the raw copies with their
      // Nunjucks-rendered versions.
      hook: 'writeBundle',
      targets: [
        { src: 'public/manifest.json', dest: 'dist', transform: compileBufferTemplate },
        { src: 'public/data/*.md', dest: 'dist/data', transform: compileBufferTemplate },
      ],
    }),
    production && generateSW(workboxConfig),
    watch && livereload({ watch: 'dist' }),
  ],
});
