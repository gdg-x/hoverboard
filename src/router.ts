import { Route, Router } from '@vaadin/router';

export let router: Router;

window.addEventListener('vaadin-router-location-changed', (event) => {
  // url ends in a slash and pathname starts with a slash
  const canonicalLink = `{$ url $}${event.detail.location.pathname.slice(1)}`;
  document.querySelector('link[rel="canonical"]').setAttribute('href', canonicalLink);
});

export const selectRouteName = (pathname: string) => {
  let [, part] = pathname.split('/');
  switch (part) {
    case '':
      part = 'home';
      break;

    case 'sessions':
      part = 'schedule';
      break;

    case 'previous-speakers':
      part = 'speakers';
      break;

    default:
      break;
  }

  return part;
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
          await import('./elements/my-schedule.js');
        },
      },
      {
        path: '/:id?',
        component: 'schedule-day',
        action: async (context, commands) => {
          const searchParams = new URLSearchParams(context.search);
          if (searchParams.get('sessionId')) {
            commands.redirect(`/sessions/${searchParams.get('sessionId')}`);
          } else {
            await import('./elements/schedule-day.js');
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
