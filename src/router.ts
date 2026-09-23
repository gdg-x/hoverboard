import { Route, Router, type Commands, type RouteContext } from '@vaadin/router';
import type { EmptyObject } from 'type-fest';
import { logPageView } from './utils/analytics.js';
import { CONFIG, getConfig } from './utils/config.js';

export let router: Router<EmptyObject, EmptyObject>;

const url = getConfig(CONFIG.URL);

window.addEventListener('vaadin-router-location-changed', (event) => {
  // url ends in a slash and pathname starts with a slash
  const canonicalLink = `${url}${event.detail.location.pathname.slice(1)}`;
  const link = document.querySelector('link[rel="canonical"]');
  if (link) {
    link.setAttribute('href', canonicalLink);
  } else {
    console.error('Missing canonical link tag');
  }
  logPageView();
});

export const selectRouteName = (pathname: string): string => {
  let [, part] = pathname.split('/');
  switch (part) {
    case 'sessions':
      part = 'schedule';
      break;

    case 'previous-speakers':
      part = 'speakers';
      break;
  }

  return part || 'home';
};

// TypeScript 6's checker hits "Type instantiation is excessively deep and
// possibly infinite" (TS2589) when checking this literal against
// `@vaadin/router`'s recursive `Route` type
// (https://github.com/microsoft/TypeScript/issues/63376). Casting through
// `unknown` avoids the deep structural check without any runtime effect.
const ROUTES = [
  {
    path: '/',
    component: 'home-page',
    action: async () => {
      await import('./pages/home-page.js');
    },
  },
  {
    path: '/blog',
    children: [
      {
        path: '',
        component: 'blog-list-page',
        action: async () => {
          await import('./pages/blog-list-page.js');
        },
      },
      { path: '/posts/:id', redirect: '/blog/:id' },
      {
        path: '/:id',
        component: 'post-page',
        action: async () => {
          await import('./pages/post-page.js');
        },
      },
    ],
  },
  {
    path: '/schedule',
    component: 'schedule-page',
    action: async () => {
      await import('./pages/schedule-page.js');
    },
    children: [
      {
        path: '/my-schedule',
        component: 'my-schedule',
        action: async () => {
          await import('./components/my-schedule.js');
        },
      },
      {
        path: '/:id?',
        component: 'schedule-day',
        action: async (context: RouteContext, commands: Commands) => {
          const searchParams = new URLSearchParams(context.search);
          if (searchParams.get('sessionId')) {
            commands.redirect(`/sessions/${searchParams.get('sessionId')}`);
          } else {
            await import('./components/schedule-day.js');
          }
        },
      },
    ],
  },
  {
    path: '/sessions',
    redirect: '/schedule',
  },
  {
    path: 'sessions/:id',
    component: 'session-page',
    action: async () => {
      await import('./pages/session-page.js');
    },
  },
  {
    path: '/speakers',
    children: [
      {
        path: '',
        component: 'speakers-page',
        action: async () => {
          await import('./pages/speakers-page.js');
        },
      },
      {
        path: '/:id',
        component: 'speaker-page',
        action: async () => {
          await import('./pages/speaker-page.js');
        },
      },
    ],
  },
  {
    path: '/previous-speakers',
    children: [
      {
        path: '',
        component: 'previous-speakers-page',
        action: async () => {
          await import('./pages/previous-speakers-page.js');
        },
      },
      {
        path: '/:id',
        component: 'previous-speaker-page',
        action: async () => {
          await import('./pages/previous-speaker-page.js');
        },
      },
    ],
  },
  {
    path: '/team',
    component: 'team-page',
    action: async () => {
      await import('./pages/team-page.js');
    },
  },
  {
    path: '/faq',
    component: 'faq-page',
    action: async () => {
      await import('./components/faq-page.js');
    },
  },
  {
    path: '/coc',
    component: 'coc-page',
    action: async () => {
      await import('./components/coc-page.js');
    },
  },
  {
    path: '(.*)',
    component: 'not-found-page',
    action: async () => {
      await import('./components/not-found-page.js');
    },
  },
] as unknown as Array<Route<EmptyObject, EmptyObject>>;

export const startRouter = (outlet: HTMLElement) => {
  router = new Router<EmptyObject, EmptyObject>(outlet);
  router.setRoutes(ROUTES);
  return router;
};
