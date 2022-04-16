import livereload from 'rollup-plugin-livereload';
import { defineConfig } from 'vite';
import nunjucks from 'vite-plugin-nunjucks';
import { VitePWA } from 'vite-plugin-pwa';
import { data, production } from './utils/build';
import { icons, Plugins, writeIndexToFunctions } from './utils/vite';
import { workboxConfig } from './utils/workbox.config';

// TODO:
// - [ ] test in supported browsers
// - [x] get livereload working
// - [ ] get service worker installing
// - [ ] test service worker
// - [x] copy files?
// - [ ] remove coc.md nunjucks or compile it
// - [ ] multiple versions of lit
// - [ ] not minified when not production
// - [ ] import.meta.env.BASE_URL https://vitejs.dev/guide/env-and-mode.html#env-variables
// - [ ] https://github.com/alloc/vite-plugin-compress
// - [ ] browser console errors/warnings

const plugins: Plugins[] = [
  nunjucks({ variables: { 'index.html': data } }),
  VitePWA({
    disable: !production,
    filename: 'service-worker.js',
    manifest: {
      name: data.title,
      short_name: data.webapp.shortName,
      background_color: data.webapp.backgroundColor,
      theme_color: data.webapp.themeColor,
      icons,
    },
    workbox: workboxConfig,
  }),
  writeIndexToFunctions(),
];

if (!production) {
  console.log('livereload enabled');
  plugins.push(livereload('functions/dist/index.html'));
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins,
  build: {
    sourcemap: production,
  },
});
