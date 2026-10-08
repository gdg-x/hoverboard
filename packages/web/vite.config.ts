import { defineConfig } from 'vite';
import livereload from 'rollup-plugin-livereload';
import { generateSW } from 'rollup-plugin-workbox';
import { chunkFileNames } from './build/chunk-names';
import { decorators } from './build/decorators';
import { production, watch } from './build/resolve-config';
import { site } from './build/vite-plugin-site';
import { workboxConfig } from './workbox.config';

export default defineConfig({
  build: {
    // `npm run clean` empties dist/ before either the app or the service
    // worker build runs; letting Vite empty it too would race with (and
    // could delete) whichever of the two builds finished first.
    emptyOutDir: false,
    outDir: 'dist',
    sourcemap: production,
    minify: production,
    target: 'es2022',
    rollupOptions: {
      treeshake: production,
      output: {
        entryFileNames: production ? '[name]-[hash].js' : '[name].js',
        chunkFileNames: chunkFileNames(production),
        // Keeps the rarely changing Firebase SDK in its own cacheable chunk.
        codeSplitting: {
          groups: [{ name: 'firebase', test: /node_modules[\\/](@firebase|firebase)[\\/]/ }],
        },
      },
    },
  },
  plugins: [
    decorators(),
    ...site(),
    production && generateSW(workboxConfig),
    watch && livereload({ watch: 'dist' }),
  ],
});
