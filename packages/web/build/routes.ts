import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import type { Feature } from '../src/config/features';
import { watchEmulatorContent } from './dev-content';

export interface Route {
  pattern: string;
  /** In `src/routes/`. */
  entrypoint: string;
  /** The feature the page belongs to. Pages without one always build. */
  feature?: Feature;
  /** The Firestore collection whose documents `getStaticPaths()` turns into pages. */
  content?: string;
}

// `src/routes/` is not Astro's `src/pages/`, so only enabled pages become routes.
export const ROUTES: readonly Route[] = [
  { pattern: '/', entrypoint: 'index.astro' },
  { pattern: '/blog', entrypoint: 'blog/index.astro', feature: 'blog' },
  { pattern: '/blog/[id]', entrypoint: 'blog/[id].astro', feature: 'blog', content: 'blog' },
  {
    pattern: '/schedule/my-schedule',
    entrypoint: 'schedule/my-schedule.astro',
    feature: 'mySchedule',
  },
  {
    pattern: '/schedule/[...day]',
    entrypoint: 'schedule/[...day].astro',
    feature: 'schedule',
    content: 'generatedSchedule',
  },
  {
    pattern: '/sessions/[id]',
    entrypoint: 'sessions/[id].astro',
    feature: 'schedule',
    content: 'generatedSessions',
  },
  { pattern: '/speakers', entrypoint: 'speakers/index.astro', feature: 'speakers' },
  {
    pattern: '/speakers/[id]',
    entrypoint: 'speakers/[id].astro',
    feature: 'speakers',
    content: 'generatedSpeakers',
  },
  {
    pattern: '/previous-speakers',
    entrypoint: 'previous-speakers/index.astro',
    feature: 'previousSpeakers',
  },
  {
    pattern: '/previous-speakers/[id]',
    entrypoint: 'previous-speakers/[id].astro',
    feature: 'previousSpeakers',
    content: 'previousSpeakers',
  },
  { pattern: '/team', entrypoint: 'team.astro', feature: 'team' },
  { pattern: '/faq', entrypoint: 'faq.astro', feature: 'faq' },
  { pattern: '/coc', entrypoint: 'coc.astro', feature: 'codeOfConduct' },
];

export const enabledRoutes = (features: Record<Feature, boolean>): Route[] =>
  ROUTES.filter(({ feature }) => !feature || features[feature]);

/** Pages for development only, such as the design gallery. `astro build` leaves them out. */
export const DEV_ROUTES: readonly Route[] = [{ pattern: '/design', entrypoint: 'design.astro' }];

/** Adds the pages of the features that are on. */
export const routes = (features: Record<Feature, boolean>): AstroIntegration => {
  let stopWatching = () => {};
  return {
    name: 'hoverboard-routes',
    hooks: {
      'astro:config:setup': ({ command, injectRoute }) => {
        const devRoutes = command === 'dev' ? DEV_ROUTES : [];
        for (const { pattern, entrypoint } of [...enabledRoutes(features), ...devRoutes]) {
          injectRoute({ pattern, entrypoint: `./src/routes/${entrypoint}` });
        }
      },
      // The dev server reads content fresh for every page, but caches `getStaticPaths()` until
      // the page's file changes. So a page added to the emulator would be a 404 until a restart.
      'astro:server:setup': ({ server }) => {
        const files = new Map<string, string[]>();
        for (const { content, entrypoint } of enabledRoutes(features)) {
          if (!content) continue;
          const file = join(dirname(fileURLToPath(import.meta.url)), '../src/routes', entrypoint);
          files.set(content, [...(files.get(content) ?? []), file]);
        }
        const timers = new Map<string, ReturnType<typeof setTimeout>>();
        stopWatching = watchEmulatorContent([...files.keys()], (collection) => {
          clearTimeout(timers.get(collection));
          // The functions write the generated collections one document at a time.
          timers.set(
            collection,
            setTimeout(() => {
              for (const file of files.get(collection) ?? []) server.watcher.emit('change', file);
            }, 500),
          );
        });
      },
      'astro:server:done': () => stopWatching(),
    },
  };
};
