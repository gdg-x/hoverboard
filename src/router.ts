import { Route, Router } from '@vaadin/router';
import { logPageView } from './utils/analytics.js';
import { CONFIG, getConfig } from './utils/config.js';

export let router: Router;

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

const ROUTES: Route[] = [
  {
    path: '/',
    component: 'home-page',
    action: async () => {
      await import('./pages/home-page.js');
    },
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
      await import('./pages/faq-page.js');
    },
  },
  {
    path: '/coc',
    component: 'coc-page',
    action: async () => {
      await import('./pages/coc-page.js');
    },
  },
  {
    path: '(.*)',
    component: 'not-found-page',
    action: async () => {
      await import('./pages/not-found-page.js');
    },
  },
];

export const startRouter = (outlet: HTMLElement) => {
  router = new Router(outlet);
  router.setRoutes(ROUTES);
  return router;
};
