import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { generateSW } from 'workbox-build';
import { workboxConfig } from '../workbox.config';

/** Writes `service-worker.js` with Workbox once the pages are built. */
export const serviceWorker = (): AstroIntegration => ({
  name: 'hoverboard-service-worker',
  hooks: {
    'astro:build:done': async ({ dir, logger }) => {
      const globDirectory = fileURLToPath(dir);
      const { count, size, warnings } = await generateSW({
        ...workboxConfig,
        globDirectory,
        swDest: join(globDirectory, 'service-worker.js'),
      });
      for (const warning of warnings) logger.warn(warning);
      logger.info(`Precached ${count} files (${Math.round(size / 1024)} KB).`);
    },
  },
});
