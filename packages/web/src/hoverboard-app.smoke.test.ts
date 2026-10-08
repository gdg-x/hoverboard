import { html, render } from 'lit';
import { resources } from 'virtual:hoverboard/site';
import { beforeAll, beforeEach, describe, expect, inject, it, vi } from 'vitest';
import { queryAllDeep } from '../__tests__/helpers/dom';
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

const linksToOffPages = () =>
  queryAllDeep(document, 'a[href]')
    .map((link) => link.getAttribute('href')!)
    .filter(isOffPath);

const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

describe(`the app with ${[...off].join(', ')} off`, () => {
  beforeAll(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    // Flags are read when modules load, so import the app after setting them.
    setFeatures(flags);
    await import('./hoverboard-app');
    await import('./views/home-page');
    render(html`<hoverboard-app><home-page></home-page></hoverboard-app>`, document.body);
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
    await settle();

    for (const feature of off) {
      for (const tag of HOME_BLOCKS[feature] ?? []) {
        expect(queryAllDeep(document, tag), tag).toHaveLength(0);
      }
    }
  });

  it('does not link to pages of features that are off', async () => {
    await settle();

    expect(linksToOffPages()).toEqual([]);
  });
});
