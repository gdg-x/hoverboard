import { type BaseRouteConfig, type RouteConfig, Router } from '@lit-labs/router';
import { html, type ReactiveControllerHost, type TemplateResult } from 'lit';
import { logPageView } from './utils/analytics.js';
import { url } from './config/site.js';

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
    const route = this.routes.find((route) => route.name === name);
    if (!route || !('path' in route)) {
      throw new Error(`Unknown route name: ${name}`);
    }
    return route.path.replace(/:(\w+)/g, (_, key: string) => encodeURIComponent(params[key] ?? ''));
  }
}

export let router: AppRouter;

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

// URLPattern leaves groups percent-encoded (e.g. `%C5%A1` for `š`).
export const decodeParam = (value: string | undefined): string | undefined => {
  try {
    return value === undefined ? value : decodeURIComponent(value);
  } catch {
    return value;
  }
};

const redirect = (path: string): false => {
  window.history.replaceState({}, '', path);
  void router.goto(path);
  return false;
};

const enter =
  (...pages: Array<() => Promise<unknown>>) =>
  async (params: Params): Promise<boolean> => {
    const { pathname, search } = window.location;
    location = {
      pathname,
      search,
      params: Object.fromEntries(
        Object.entries(params).map(([key, value]) => [key, decodeParam(value)]),
      ),
    };
    onLocationChanged(pathname);
    await Promise.all(pages.map((page) => page()));
    return true;
  };

const schedulePage = (child: TemplateResult) =>
  html`<schedule-page .location="${location}">${child}</schedule-page>`;

const loadSchedulePage = () => import('./pages/schedule-page.js');

// Each `__HB_FEATURES__.<name>` is a literal in the build, so disabled pages are not bundled.
const createRoutes = (): Array<RouteConfig> => [
  {
    path: '/',
    enter: enter(() => import('./pages/home-page.js')),
    render: () => html`<home-page></home-page>`,
  },
  ...(__HB_FEATURES__.blog
    ? [
        {
          path: '/blog',
          enter: enter(() => import('./pages/blog-list-page.js')),
          render: () => html`<blog-list-page></blog-list-page>`,
        },
        {
          path: '/blog/posts/:id',
          enter: ({ id }: Params) => redirect(`/blog/${id ?? ''}`),
        },
        {
          path: '/blog/:id',
          name: 'post-page',
          enter: enter(() => import('./pages/post-page.js')),
          render: ({ id }: Params) => html`<post-page .postId="${decodeParam(id)}"></post-page>`,
        },
      ]
    : []),
  // Before `/schedule/:id?`, which would otherwise match `my-schedule` as a day.
  ...(__HB_FEATURES__.mySchedule
    ? [
        {
          path: '/schedule/my-schedule',
          enter: enter(loadSchedulePage, () => import('./pages/schedule/my-schedule.js')),
          render: () => schedulePage(html`<my-schedule></my-schedule>`),
        },
      ]
    : []),
  ...(__HB_FEATURES__.schedule
    ? [
        {
          path: '/schedule/:id?',
          enter: (params: Params) => {
            const sessionId = new URLSearchParams(window.location.search).get('sessionId');
            if (sessionId) {
              return redirect(`/sessions/${encodeURIComponent(sessionId)}`);
            }
            return enter(
              loadSchedulePage,
              () => import('./pages/schedule/schedule-day.js'),
            )(params);
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
          render: ({ id }: Params) =>
            html`<session-page .sessionId="${decodeParam(id)}"></session-page>`,
        },
      ]
    : []),
  ...(__HB_FEATURES__.speakers
    ? [
        {
          path: '/speakers',
          enter: enter(() => import('./pages/speakers-page.js')),
          render: () => html`<speakers-page></speakers-page>`,
        },
        {
          path: '/speakers/:id',
          name: 'speaker-page',
          enter: enter(() => import('./pages/speaker-page.js')),
          render: ({ id }: Params) =>
            html`<speaker-page .speakerId="${decodeParam(id)}"></speaker-page>`,
        },
      ]
    : []),
  ...(__HB_FEATURES__.previousSpeakers
    ? [
        {
          path: '/previous-speakers',
          enter: enter(() => import('./pages/previous-speakers-page.js')),
          render: () => html`<previous-speakers-page></previous-speakers-page>`,
        },
        {
          path: '/previous-speakers/:id',
          name: 'previous-speaker-page',
          enter: enter(() => import('./pages/previous-speaker-page.js')),
          render: ({ id }: Params) =>
            html`<previous-speaker-page .speakerId="${decodeParam(id)}"></previous-speaker-page>`,
        },
      ]
    : []),
  ...(__HB_FEATURES__.team
    ? [
        {
          path: '/team',
          enter: enter(() => import('./pages/team-page.js')),
          render: () => html`<team-page></team-page>`,
        },
      ]
    : []),
  ...(__HB_FEATURES__.faq
    ? [
        {
          path: '/faq',
          enter: enter(() => import('./pages/faq-page.js')),
          render: () => html`<faq-page></faq-page>`,
        },
      ]
    : []),
  ...(__HB_FEATURES__.codeOfConduct
    ? [
        {
          path: '/coc',
          enter: enter(() => import('./pages/coc-page.js')),
          render: () => html`<coc-page></coc-page>`,
        },
      ]
    : []),
];

const FALLBACK: BaseRouteConfig = {
  enter: enter(() => import('./pages/not-found-page.js')),
  render: () => html`<not-found-page></not-found-page>`,
};

export const startRouter = (host: ReactiveControllerHost & HTMLElement) => {
  router = new AppRouter(host, createRoutes(), { fallback: FALLBACK });
  return router;
};
