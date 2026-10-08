import { html, render } from 'lit';
import { resources } from 'virtual:hoverboard/site';
import { beforeAll, beforeEach, describe, expect, inject, it, vi } from 'vitest';
import { setFeatures } from '../__tests__/helpers/features';
import { FEATURE_REQUIRES, FEATURES, type Feature } from './config/features';

// Pages subscribe to Firestore when they render. Without a backend they stay loading.
vi.mock('firebase/firestore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/firestore')>()),
  onSnapshot: vi.fn(() => () => undefined),
  getDoc: vi.fn(() => new Promise(() => undefined)),
}));

declare module 'vitest' {
  export interface ProvidedContext {
    featureOff: Feature;
  }
}

// Features that need the one under test are off too, as in a valid site.json.
const withDependents = (feature: Feature): Feature[] => [
  feature,
  ...FEATURES.filter((other) => FEATURE_REQUIRES[other]?.includes(feature)).flatMap(withDependents),
];

const featureOff = inject('featureOff');
const off = new Set(withDependents(featureOff));
const flags = Object.fromEntries([...off].map((feature) => [feature, false]));

// Each page path and the element it renders.
const PAGES: Partial<Record<Feature, Record<string, string>>> = {
  blog: { '/blog': 'blog-list-page', '/blog/a-post': 'post-page' },
  codeOfConduct: { '/coc': 'coc-page' },
  faq: { '/faq': 'faq-page' },
  mySchedule: { '/schedule/my-schedule': 'my-schedule' },
  previousSpeakers: {
    '/previous-speakers': 'previous-speakers-page',
    '/previous-speakers/a-speaker': 'previous-speaker-page',
  },
  schedule: { '/schedule': 'schedule-day', '/sessions/a-session': 'session-page' },
  speakers: { '/speakers': 'speakers-page', '/speakers/a-speaker': 'speaker-page' },
  team: { '/team': 'team-page' },
};

const LINK_PATHS: Partial<Record<Feature, string[]>> = {
  blog: ['/blog'],
  codeOfConduct: ['/coc'],
  faq: ['/faq'],
  mySchedule: ['/schedule/my-schedule'],
  previousSpeakers: ['/previous-speakers'],
  schedule: ['/schedule', '/sessions'],
  speakers: ['/speakers'],
  team: ['/team'],
};

const HOME_BLOCKS: Partial<Record<Feature, string[]>> = {
  blog: ['latest-posts-block'],
  forkMe: ['fork-me-block'],
  gallery: ['gallery-block'],
  map: ['map-block'],
  partners: ['partners-block'],
  speakers: ['speakers-block'],
  subscribe: ['subscribe-block'],
  tickets: ['tickets-block'],
  videos: ['featured-videos'],
};

// home-page imports these when it loads. The others load when they scroll into view.
const EAGER_HOME_BLOCKS: Partial<Record<Feature, string>> = {
  blog: 'latest-posts-block',
  forkMe: 'fork-me-block',
  speakers: 'speakers-block',
  subscribe: 'subscribe-block',
};

const offPaths = [...off].flatMap((feature) => LINK_PATHS[feature] ?? []);

const isOffPath = (href: string) => {
  const { origin, pathname } = new URL(href, window.location.origin);
  return (
    origin === window.location.origin &&
    offPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  );
};

// Config validation rejects content links to pages of features that are off.
for (const block of resources.footerRelBlock) {
  block.links = block.links.filter(({ url }) => !isOffPath(url));
}
resources.aboutOrganizerBlock.blocks = resources.aboutOrganizerBlock.blocks.filter(
  ({ callToAction }) => !isOffPath(callToAction.link),
);

const queryAllDeep = (root: ParentNode, selector: string): Element[] => [
  ...root.querySelectorAll(selector),
  ...[...root.querySelectorAll('*')].flatMap((element) =>
    element.shadowRoot ? queryAllDeep(element.shadowRoot, selector) : [],
  ),
];

const linksToOffPages = () =>
  queryAllDeep(document, 'a[href]')
    .map((link) => link.getAttribute('href')!)
    .filter(isOffPath);

let routerModule: typeof import('./router');

const visit = async (path: string) => {
  window.history.pushState({}, '', path);
  await routerModule.router.goto(path);
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

describe(`the app with ${[...off].join(', ')} off`, () => {
  beforeAll(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    // Flags are read when modules load, so import the app after setting them.
    setFeatures(flags);
    routerModule = await import('./router');
    await import('./hoverboard-app');
    render(html`<hoverboard-app></hoverboard-app>`, document.body);
    await vi.waitFor(
      () => {
        expect(queryAllDeep(document, 'home-page')).toHaveLength(1);
        for (const [feature, tag] of Object.entries(EAGER_HOME_BLOCKS)) {
          if (!off.has(feature as Feature)) expect(customElements.get(tag), tag).toBeDefined();
        }
      },
      { timeout: 10_000 },
    );
  });

  beforeEach(() => setFeatures(flags));

  it('renders the home page without the blocks of features that are off', async () => {
    await visit('/');
    await settle();

    for (const feature of off) {
      for (const tag of HOME_BLOCKS[feature] ?? []) {
        expect(queryAllDeep(document, tag), tag).toHaveLength(0);
      }
    }
  });

  it('does not link to pages of features that are off', async () => {
    await visit('/');
    await settle();

    expect(linksToOffPages()).toEqual([]);
  });

  const pages = Object.entries(PAGES).flatMap(([feature, pagesOfFeature]) =>
    Object.entries(pagesOfFeature).map(([path, tag]) => ({
      feature: feature as Feature,
      path,
      tag,
    })),
  );

  it.each(pages.filter(({ feature }) => off.has(feature)))(
    'does not render $tag at $path',
    async ({ path, tag }) => {
      await visit(path);
      await settle();

      expect(queryAllDeep(document, tag)).toHaveLength(0);
    },
  );

  it.each(pages.filter(({ feature }) => !off.has(feature)))(
    'renders $tag at $path',
    async ({ path, tag }) => {
      await visit(path);

      await vi.waitFor(() => expect(queryAllDeep(document, tag)).toHaveLength(1), {
        timeout: 10_000,
      });
    },
  );
});
