import { type BaseRouteConfig, type RouteConfig, Router } from '@lit-labs/router';
import { html, type ReactiveControllerHost, type TemplateResult } from 'lit';
import { logPageView } from './utils/analytics.js';
import { CONFIG, getConfig } from './utils/config.js';

type Params = Record<string, string | undefined>;

export interface RouteLocation {
  pathname: string;
  search: string;
  params: Params;
}

export class AppRouter extends Router {
  override async goto(pathname: string): Promise<void> {
    await super.goto(pathname);
    window.scrollTo(0, 0);
  }

  urlForName(name: string, params: Record<string, string> = {}): string {
    const route = ROUTES.find((route) => route.name === name);
    if (!route || !('path' in route)) {
      throw new Error(`Unknown route name: ${name}`);
    }
    return route.path.replace(/:(\w+)/g, (_, key: string) => encodeURIComponent(params[key] ?? ''));
  }
}

export let router: AppRouter;

const url = getConfig(CONFIG.URL);

export const onLocationChanged = (pathname: string) => {
  // url ends in a slash and pathname starts with a slash
  const canonicalLink = `${url}${pathname.slice(1)}`;
  const link = document.querySelector('link[rel="canonical"]');
  if (link) {
    link.setAttribute('href', canonicalLink);
  } else {
    console.error('Missing canonical link tag');
  }
  logPageView();
};

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

// Updated on every navigation so renders reuse one object instead of re-creating it.
let location: RouteLocation = { pathname: '/', search: '', params: {} };

const redirect = (path: string): false => {
  window.history.replaceState({}, '', path);
  void router.goto(path);
  return false;
};

const enter =
  (...pages: Array<() => Promise<unknown>>) =>
  async (params: Params): Promise<boolean> => {
    const { pathname, search } = window.location;
    location = { pathname, search, params };
    onLocationChanged(pathname);
    await Promise.all(pages.map((page) => page()));
    return true;
  };

const schedulePage = (child: TemplateResult) =>
  html`<schedule-page .location="${location}">${child}</schedule-page>`;

const loadSchedulePage = () => import('./pages/schedule-page.js');

const ROUTES: Array<RouteConfig> = [
  {
    path: '/',
    enter: enter(() => import('./pages/home-page.js')),
    render: () => html`<home-page></home-page>`,
  },
  {
    path: '/blog',
    enter: enter(() => import('./pages/blog-list-page.js')),
    render: () => html`<blog-list-page></blog-list-page>`,
  },
  {
    path: '/blog/posts/:id',
    enter: ({ id }) => redirect(`/blog/${encodeURIComponent(id ?? '')}`),
  },
  {
    path: '/blog/:id',
    name: 'post-page',
    enter: enter(() => import('./pages/post-page.js')),
    render: ({ id }) => html`<post-page .postId="${id}"></post-page>`,
  },
  {
    path: '/schedule/my-schedule',
    enter: enter(loadSchedulePage, () => import('./pages/schedule/my-schedule.js')),
    render: () => schedulePage(html`<my-schedule></my-schedule>`),
  },
  {
    path: '/schedule/:id?',
    enter: (params) => {
      const sessionId = new URLSearchParams(window.location.search).get('sessionId');
      if (sessionId) {
        return redirect(`/sessions/${encodeURIComponent(sessionId)}`);
      }
      return enter(loadSchedulePage, () => import('./pages/schedule/schedule-day.js'))(params);
    },
    render: () => schedulePage(html`<schedule-day .location="${location}"></schedule-day>`),
  },
  {
    path: '/sessions',
    enter: () => redirect('/schedule'),
  },
  {
    path: '/sessions/:id',
    name: 'session-page',
    enter: enter(() => import('./pages/session-page.js')),
    render: ({ id }) => html`<session-page .sessionId="${id}"></session-page>`,
  },
  {
    path: '/speakers',
    enter: enter(() => import('./pages/speakers-page.js')),
    render: () => html`<speakers-page></speakers-page>`,
  },
  {
    path: '/speakers/:id',
    name: 'speaker-page',
    enter: enter(() => import('./pages/speaker-page.js')),
    render: ({ id }) => html`<speaker-page .speakerId="${id}"></speaker-page>`,
  },
  {
    path: '/previous-speakers',
    enter: enter(() => import('./pages/previous-speakers-page.js')),
    render: () => html`<previous-speakers-page></previous-speakers-page>`,
  },
  {
    path: '/previous-speakers/:id',
    name: 'previous-speaker-page',
    enter: enter(() => import('./pages/previous-speaker-page.js')),
    render: ({ id }) => html`<previous-speaker-page .speakerId="${id}"></previous-speaker-page>`,
  },
  {
    path: '/team',
    enter: enter(() => import('./pages/team-page.js')),
    render: () => html`<team-page></team-page>`,
  },
  {
    path: '/faq',
    enter: enter(() => import('./pages/faq-page.js')),
    render: () => html`<faq-page></faq-page>`,
  },
  {
    path: '/coc',
    enter: enter(() => import('./pages/coc-page.js')),
    render: () => html`<coc-page></coc-page>`,
  },
];

const FALLBACK: BaseRouteConfig = {
  enter: enter(() => import('./pages/not-found-page.js')),
  render: () => html`<not-found-page></not-found-page>`,
};

export const startRouter = (host: ReactiveControllerHost & HTMLElement) => {
  router = new AppRouter(host, ROUTES, { fallback: FALLBACK });
  return router;
};
