import lit from '@awesome.me/astro-lit';
import { defineConfig } from 'astro/config';
import { chunkFileNames } from './build/chunk-names';
import { decorators } from './build/decorators';
import { production, resolveConfig } from './build/resolve-config';
import { routes } from './build/routes';
import { serviceWorker } from './build/service-worker';
import { site } from './build/vite-plugin-site';

const config = resolveConfig();

export default defineConfig({
  output: 'static',
  // Matches `trailingSlash: false` in firebase.json: `/speakers/abc` is `speakers/abc.html`.
  trailingSlash: 'never',
  // Pages share one store, which each page fills with its content in turn (`seedPage()`).
  build: { format: 'file', concurrency: 1 },
  integrations: [
    lit(),
    {
      name: 'hoverboard-hydration',
      hooks: {
        // Islands import this before their components. Loaded later, a component renders twice.
        'astro:config:setup': ({ injectScript }) =>
          injectScript(
            'before-hydration',
            `import '@awesome.me/astro-lit/dsd-polyfill.js';
            import '@awesome.me/astro-lit/hydration-support.js';`,
          ),
      },
    },
    routes(config.site.features),
    serviceWorker(),
  ],
  vite: {
    // The build smoke test links node_modules into a copy of this package. Astro fails on
    // `.astro` files that resolve outside its root.
    resolve: { preserveSymlinks: true },
    build: {
      sourcemap: production,
      minify: production,
      rolldownOptions: {
        output: {
          // Keeps the rarely changing Firebase SDK in its own cacheable chunk.
          codeSplitting: {
            groups: [{ name: 'firebase', test: /node_modules[\\/](@firebase|firebase)[\\/]/ }],
          },
        },
      },
    },
    // Astro names client chunks itself unless the client environment says otherwise.
    environments: {
      client: { build: { rolldownOptions: { output: { chunkFileNames } } } },
    },
    plugins: [decorators(), ...site(config)],
  },
});
