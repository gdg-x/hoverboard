import { defineConfig } from 'vite';
import { production } from './utils/build';

// The Firebase Messaging service worker is bundled as its own, fully
// self-contained entry (no code-splitting with the main app) since it is
// registered directly as a classic script and cannot use dynamic imports for
// shared chunks. Kept as a separate Vite build/config so its module graph
// never gets merged with the main app's.
export default defineConfig({
  publicDir: false,
  build: {
    emptyOutDir: false,
    outDir: 'dist',
    sourcemap: production,
    minify: production,
    target: 'es2019',
    rollupOptions: {
      input: 'src/firebase-messaging-sw.ts',
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
});
