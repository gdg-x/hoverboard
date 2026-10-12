import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { generateSW } from 'workbox-build';
import { workboxConfig } from '../workbox.config';
import type { SiteConfig } from './resolve-config';

/**
 * The attending page and its images, which attendees may need at the venue without a connection,
 * even if they never opened the page before. Images on other sites are not precached.
 */
export const attendingPrecache = ({
  site,
  resources,
}: Pick<SiteConfig, 'site' | 'resources'>): string[] => {
  if (!site.features.attending) return [];
  const { photo, floorPlan } = resources.attendingPage ?? {};
  const images = site.event.attendance === 'online' ? [] : [photo?.image, floorPlan?.image];
  return [
    'attending.html',
    ...images
      .filter((image): image is string => !!image && !/^https?:\/\//.test(image))
      .map((image) => image.replace(/^\//, '')),
  ];
};

/**
 * The schedule's pages, once it's published, so attendees can open any day at the venue without a
 * connection. Workbox leaves out pages over its size limit, with a warning.
 */
export const schedulePrecache = ({ site }: Pick<SiteConfig, 'site'>): string[] =>
  site.features.schedule && site.schedule.published ? ['schedule.html', 'schedule/*.html'] : [];

/** Writes `service-worker.js` with Workbox once the pages are built, precaching `files` too. */
export const serviceWorker = (files: string[] = []): AstroIntegration => ({
  name: 'hoverboard-service-worker',
  hooks: {
    'astro:build:done': async ({ dir, logger }) => {
      const globDirectory = fileURLToPath(dir);
      const { count, size, warnings } = await generateSW({
        ...workboxConfig,
        globPatterns: [...(workboxConfig.globPatterns ?? []), ...files],
        globDirectory,
        swDest: join(globDirectory, 'service-worker.js'),
      });
      for (const warning of warnings) logger.warn(warning);
      logger.info(`Precached ${count} files (${Math.round(size / 1024)} KB).`);
    },
  },
});
