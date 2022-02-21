import livereload from 'rollup-plugin-livereload';
import { defineConfig, Plugin } from 'vite';
import nunjucks from 'vite-plugin-nunjucks';
import { VitePWA } from 'vite-plugin-pwa';
import { data, production } from './build-utils';
import { workboxConfig } from './workbox.config';

console.log({ production });

// TODO:
// - [ ] test in supported browsers
// - [ ] get livereload working
// - [ ] get service worker installing
// - [ ] test service worker
// - [ ] copy files?
// - [ ] remove coc.md nunjucks or process
// - [ ] multiple versions of lit
// - [ ] not minified when not production

const plugins: (Plugin | Plugin[])[] = [nunjucks({ variables: { 'index.html': data } })];

if (production) {
  plugins.push(
    VitePWA({
      disable: !production,
      filename: 'service-worker.js',
      manifest: {
        name: data.title,
        short_name: data.webapp.shortName,
        background_color: data.webapp.backgroundColor,
        theme_color: data.webapp.themeColor,
        icons: [
          {
            src: 'images/manifest/icon-16.png',
            sizes: '16x16',
            type: 'image/png',
          },
          {
            src: 'images/manifest/icon-32.png',
            sizes: '32x32',
            type: 'image/png',
          },
          {
            src: 'images/manifest/icon-48.png',
            sizes: '48x48',
            type: 'image/png',
          },
          {
            src: 'images/manifest/icon-57.png',
            sizes: '57x57',
            type: 'image/png',
          },
          {
            src: 'images/manifest/icon-60.png',
            sizes: '60x60',
            type: 'image/png',
          },
          {
            src: 'images/manifest/icon-72.png',
            sizes: '72x72',
            type: 'image/png',
          },
          {
            src: 'images/manifest/icon-76.png',
            sizes: '76x76',
            type: 'image/png',
          },
          {
            src: 'images/manifest/icon-96.png',
            sizes: '96x96',
            type: 'image/png',
          },
          {
            src: 'images/manifest/icon-114.png',
            sizes: '114x114',
            type: 'image/png',
          },
          {
            src: 'images/manifest/icon-120.png',
            sizes: '120x120',
            type: 'image/png',
          },
          {
            src: 'images/manifest/icon-144.png',
            sizes: '144x144',
            type: 'image/png',
          },
          {
            src: 'images/manifest/icon-152.png',
            sizes: '152x152',
            type: 'image/png',
          },
          {
            src: 'images/manifest/icon-180.png',
            sizes: '180x180',
            type: 'image/png',
          },
          {
            src: 'images/manifest/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'images/manifest/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: workboxConfig,
    })
  );
} else {
  plugins.push(
    livereload({
      watch: 'functions/dist',
      // delay: 1000,
    })
  );
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins,
  build: {
    target: 'esnext',
    sourcemap: production,
    rollupOptions: {
      treeshake: production,
      output: {
        entryFileNames: production ? '[name]-[hash].js' : '[name].js',
        chunkFileNames: production ? '[name]-[hash].js' : '[name].js',
        assetFileNames: production ? '[name]-[hash].[ext]' : '[name].[ext]',
      },
    },
  },
});
