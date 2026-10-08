import type { AstroIntegration } from 'astro';
import type { Feature } from '../src/config/features';

export interface Route {
  pattern: string;
  /** In `src/routes/`. */
  entrypoint: string;
  /** The feature the page belongs to. Pages without one always build. */
  feature?: Feature;
}

// `src/routes/` is not Astro's `src/pages/`, so only enabled pages become routes.
export const ROUTES: readonly Route[] = [
  { pattern: '/', entrypoint: 'index.astro' },
  { pattern: '/blog', entrypoint: 'blog/index.astro', feature: 'blog' },
  { pattern: '/blog/[id]', entrypoint: 'blog/[id].astro', feature: 'blog' },
  {
    pattern: '/schedule/my-schedule',
    entrypoint: 'schedule/my-schedule.astro',
    feature: 'mySchedule',
  },
  { pattern: '/schedule/[...day]', entrypoint: 'schedule/[...day].astro', feature: 'schedule' },
  { pattern: '/sessions/[id]', entrypoint: 'sessions/[id].astro', feature: 'schedule' },
  { pattern: '/speakers', entrypoint: 'speakers/index.astro', feature: 'speakers' },
  { pattern: '/speakers/[id]', entrypoint: 'speakers/[id].astro', feature: 'speakers' },
  {
    pattern: '/previous-speakers',
    entrypoint: 'previous-speakers/index.astro',
    feature: 'previousSpeakers',
  },
  {
    pattern: '/previous-speakers/[id]',
    entrypoint: 'previous-speakers/[id].astro',
    feature: 'previousSpeakers',
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
export const routes = (features: Record<Feature, boolean>): AstroIntegration => ({
  name: 'hoverboard-routes',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      const devRoutes = command === 'dev' ? DEV_ROUTES : [];
      for (const { pattern, entrypoint } of [...enabledRoutes(features), ...devRoutes]) {
        injectRoute({ pattern, entrypoint: `./src/routes/${entrypoint}` });
      }
    },
  },
});
