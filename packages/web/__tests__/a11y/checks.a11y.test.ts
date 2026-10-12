import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type Browser, chromium, type Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { openPage, resultsDir, slug } from './browser';

/** Helpers that the checks install in the page, for walking shadow roots in the flat tree. */
interface Helpers {
  /** Every element, shadow roots included. */
  all: (root?: ParentNode) => Element[];
  /** The parent in the flat tree: the slot an element is assigned to, or the host of its shadow root. */
  parent: (element: Element) => Element | null;
  /** A short name for an element, with its host components, for failure messages. */
  describe: (element: Element) => string;
  /** The focused element, inside shadow roots. */
  active: () => Element | null;
  /** How an element and its nearest ancestors look, to tell whether focus changes them. */
  look: (element: Element) => string;
}

type HelperWindow = Window & { hb: Helpers; hbFocused: Element[] };

const installHelpers = (page: Page) =>
  page.evaluate(() => {
    const all = (root: ParentNode = document): Element[] =>
      [...root.querySelectorAll('*')].flatMap((element) =>
        element.shadowRoot ? [element, ...all(element.shadowRoot)] : [element],
      );
    const parent = (element: Element) =>
      element.assignedSlot ??
      element.parentElement ??
      (element.parentNode instanceof ShadowRoot ? element.parentNode.host : null);
    const describe = (element: Element) => {
      const own = `${element.localName}${element.id ? `#${element.id}` : ''}${[...element.classList]
        .map((name) => `.${name}`)
        .join('')}`;
      const hosts: string[] = [];
      for (let node = element.getRootNode(); node instanceof ShadowRoot;) {
        hosts.unshift(node.host.localName);
        node = node.host.getRootNode();
      }
      const text = element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 30);
      return [...hosts, own].join(' > ') + (text ? ` "${text}"` : '');
    };
    const active = () => {
      let element = document.activeElement;
      while (element?.shadowRoot?.activeElement) element = element.shadowRoot.activeElement;
      return element === document.body ? null : element;
    };
    const look = (element: Element) => {
      const chain = [element];
      while (chain.length < 4 && parent(chain.at(-1)!)) chain.push(parent(chain.at(-1)!)!);
      return chain
        .map((node) => {
          const style = getComputedStyle(node);
          return [
            style.outlineStyle,
            style.outlineWidth,
            style.outlineColor,
            style.boxShadow,
            style.backgroundColor,
            style.borderColor,
            style.textDecorationLine,
          ].join(' ');
        })
        .join(' | ');
    };
    (window as unknown as HelperWindow).hb = { all, parent, describe, active, look };
  });

const sites = inject('a11ySites');
const pages = Object.entries(sites).flatMap(([site, { url, paths }]) =>
  paths.map((path) => ({ site, url, path, label: `${site} ${path}` })),
);
const titles = new Map<string, string>();

let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch();
});

afterAll(async () => {
  await browser.close();
});

describe.concurrent('structure', () => {
  it.for(pages)('has one h1, the landmarks and a title on $label', async (target, { expect }) => {
    const { page, close } = await openPage(browser, target.url, target.path);
    try {
      const title = await page.title();
      titles.set(`${target.site} ${target.path}`, title);

      expect(title).not.toBe('');
      expect(await page.getByRole('heading', { level: 1 }).count(), 'h1').toBe(1);
      expect(await page.getByRole('banner').count(), 'banner').toBe(1);
      expect(await page.getByRole('main').count(), 'main').toBe(1);
      expect(await page.getByRole('contentinfo').count(), 'contentinfo').toBe(1);
    } finally {
      await close();
    }
  });
});

// After the structure checks, which run concurrently above.
it('gives each page its own title', ({ skip }) => {
  if (titles.size < pages.length) skip();
  const byTitle = new Map<string, string[]>();
  for (const [page, title] of titles) {
    const key = `${page.split(' ')[0]} "${title}"`;
    byTitle.set(key, [...(byTitle.get(key) ?? []), page]);
  }

  expect(
    [...byTitle]
      .filter(([, shared]) => shared.length > 1)
      .map(([title, shared]) => `${title}: ${shared.join(', ')}`),
  ).toEqual([]);
});

describe.concurrent('keyboard', () => {
  it.for(Object.entries(sites).map(([site, { url }]) => ({ site, url })))(
    'skips to the main content on $site',
    async ({ url }, { expect }) => {
      const { page, close } = await openPage(browser, url, '/');
      try {
        await installHelpers(page);
        await page.keyboard.press('Tab');
        const first = await page.evaluate(() => {
          const { hb } = window as unknown as HelperWindow;
          return hb.active()?.textContent?.trim();
        });
        await page.keyboard.press('Enter');
        const after = await page.evaluate(() => {
          const { hb } = window as unknown as HelperWindow;
          return hb.active()?.localName;
        });

        expect(first).toBe('Skip to content');
        expect(after).toBe('main');
      } finally {
        await close();
      }
    },
  );

  it.for(pages)(
    'reaches the footer with Tab, each stop visible, marked and uncovered, on $label',
    async (target, { expect }) => {
      // Reduced motion scrolls each stop into view at once, so it can be measured.
      const { page, close } = await openPage(browser, target.url, target.path, {
        context: { reducedMotion: 'reduce' },
      });
      try {
        await installHelpers(page);
        await page.evaluate(() => {
          (window as unknown as HelperWindow).hbFocused = [];
        });
        const stops: {
          name: string;
          hidden: boolean;
          /** What covers the whole stop, which fails 2.4.11, or part of it, which is only reported. */
          coveredBy?: string;
          partlyCoveredBy?: string;
          footer: boolean;
          look: string;
        }[] = [];
        for (let press = 0; press < 500; press++) {
          await page.keyboard.press('Tab');
          const stop = await page.evaluate(
            () =>
              new Promise<(typeof stops)[number] | 'end'>((resolve) =>
                // Two frames, for a skip link that slides in.
                requestAnimationFrame(() =>
                  requestAnimationFrame(() => {
                    const { hb, hbFocused } = window as unknown as HelperWindow;
                    const element = hb.active();
                    if (!element || hbFocused.includes(element)) return resolve('end');
                    hbFocused.push(element);
                    const rect = element.getBoundingClientRect();
                    const hidden =
                      rect.width < 1 ||
                      rect.height < 1 ||
                      getComputedStyle(element).visibility === 'hidden' ||
                      rect.bottom <= 0 ||
                      rect.top >= innerHeight;
                    const ancestors = (node: Element | null): Element[] =>
                      node ? [node, ...ancestors(hb.parent(node))] : [];
                    const own = ancestors(element);
                    // The topmost element at a point, inside shadow roots.
                    const hitAt = (x: number, y: number) => {
                      let hit = document.elementFromPoint(x, y);
                      while (hit?.shadowRoot) {
                        const inner = hit.shadowRoot.elementFromPoint(x, y);
                        if (!inner || inner === hit) break;
                        hit = inner;
                      }
                      return hit;
                    };
                    // Its content, an ancestor such as its host, or its label. Toasts close by
                    // themselves, and here only say that the tests block the service worker.
                    const belongs = (hit: Element | null) =>
                      !hit ||
                      own.includes(hit) ||
                      ancestors(hit).some(
                        (node) =>
                          node === element ||
                          node.localName === 'snack-bar' ||
                          (node instanceof HTMLLabelElement && node.control === element),
                      );
                    // The center and the middle of each edge: corners can be rounded off.
                    const inset = 2;
                    const [midX, midY] = [rect.left + rect.width / 2, rect.top + rect.height / 2];
                    const covers = [
                      [midX, midY],
                      [midX, rect.top + inset],
                      [midX, rect.bottom - inset],
                      [rect.left + inset, midY],
                      [rect.right - inset, midY],
                    ]
                      .filter(([, y]) => y! >= 0 && y! < innerHeight)
                      .map(([x, y]) => hitAt(x!, y!))
                      .filter((hit) => !belongs(hit));
                    const by = covers[0] ? hb.describe(covers[0]) : undefined;
                    resolve({
                      name: hb.describe(element),
                      hidden,
                      ...(by && covers.length === 5 ? { coveredBy: by } : {}),
                      ...(by && covers.length < 5 ? { partlyCoveredBy: by } : {}),
                      footer: own.some(({ localName }) => localName === 'footer-block'),
                      look: hb.look(element),
                    });
                  }),
                ),
              ),
          );
          if (stop === 'end') break;
          stops.push(stop);
        }
        await page.evaluate(() => {
          const { hb } = window as unknown as HelperWindow;
          (hb.active() as HTMLElement | null)?.blur();
        });
        const unfocused = await page.evaluate(() => {
          const { hb, hbFocused } = window as unknown as HelperWindow;
          return hbFocused.map((element) => hb.look(element));
        });
        mkdirSync(resultsDir, { recursive: true });
        writeFileSync(
          join(resultsDir, `keyboard-${slug(target.label)}.json`),
          JSON.stringify(stops, null, 2),
        );

        expect.soft(stops.length, 'stops').toBeGreaterThan(0);
        expect
          .soft(
            stops.some(({ footer }) => footer),
            'reaches the footer',
          )
          .toBe(true);
        expect
          .soft(
            stops.filter(({ hidden }) => hidden).map(({ name }) => name),
            'hidden',
          )
          .toEqual([]);
        expect
          .soft(
            stops
              .filter(({ coveredBy }) => coveredBy)
              .map(({ name, coveredBy }) => `${name} under ${coveredBy}`),
            'covered',
          )
          .toEqual([]);
        expect(
          stops.filter(({ look }, index) => look === unfocused[index]).map(({ name }) => name),
          'no focus indicator',
        ).toEqual([]);
      } finally {
        await close();
      }
    },
  );
});

describe.concurrent('reflow', () => {
  it.for(pages)("doesn't scroll sideways at 320px on $label", async (target, { expect }) => {
    const { page, close } = await openPage(browser, target.url, target.path, {
      context: { viewport: { width: 320, height: 640 } },
    });
    try {
      await installHelpers(page);
      const wide = await page.evaluate(() => {
        const { hb } = window as unknown as HelperWindow;
        const width = document.documentElement.clientWidth;
        if (document.documentElement.scrollWidth <= width) return [];
        // The elements past the edge that no scrolling or clipping ancestor holds in.
        const holds = (element: Element) => getComputedStyle(element).overflowX !== 'visible';
        return hb
          .all()
          .filter((element) => {
            if (element.getBoundingClientRect().right <= width + 1) return false;
            for (let node = hb.parent(element); node; node = hb.parent(node)) {
              if (holds(node)) return false;
            }
            return true;
          })
          .map((element) => hb.describe(element))
          .slice(0, 5);
      });

      expect(wide).toEqual([]);
    } finally {
      await close();
    }
  });
});

describe.concurrent('motion', () => {
  it.for(pages)('stops animating with reduced motion on $label', async (target, { expect }) => {
    const { page, close } = await openPage(browser, target.url, target.path, {
      context: { reducedMotion: 'reduce' },
    });
    try {
      await installHelpers(page);
      await page.waitForTimeout(1000);
      const running = await page.evaluate(() => {
        const { hb } = window as unknown as HelperWindow;
        const roots: DocumentOrShadowRoot[] = [
          document,
          ...hb.all().flatMap(({ shadowRoot }) => shadowRoot ?? []),
        ];
        return [...new Set(roots.flatMap((root) => root.getAnimations()))]
          .filter(({ playState }) => playState === 'running')
          .map((animation) => {
            const target = (animation.effect as KeyframeEffect | null)?.target;
            const what =
              animation instanceof CSSAnimation
                ? animation.animationName
                : animation instanceof CSSTransition
                  ? animation.transitionProperty
                  : 'script';
            return `${target ? hb.describe(target) : 'no target'}: ${what}`;
          });
      });

      expect(running).toEqual([]);
    } finally {
      await close();
    }
  });
});

describe.concurrent('text spacing', () => {
  // Reported, not failed, until the heuristic is reliable: see test-results/a11y/text-spacing-*.json.
  // eslint-disable-next-line vitest/expect-expect -- reports only
  it.for(pages)(
    'reports text that 1.4.12 spacing clips on $label',
    async (target, { annotate }) => {
      const { page, close } = await openPage(browser, target.url, target.path);
      try {
        await installHelpers(page);
        const clipped = () =>
          page.evaluate(() => {
            const { hb } = window as unknown as HelperWindow;
            return hb
              .all()
              .filter((element) => {
                const style = getComputedStyle(element);
                const clips = [style.overflowX, style.overflowY].some(
                  (overflow) => overflow === 'hidden' || overflow === 'clip',
                );
                return (
                  clips &&
                  !!element.textContent?.trim() &&
                  (element.scrollWidth > element.clientWidth + 1 ||
                    element.scrollHeight > element.clientHeight + 1)
                );
              })
              .map((element) => hb.describe(element));
          });
        const before = new Set(await clipped());
        await page.evaluate(() => {
          const { hb } = window as unknown as HelperWindow;
          const sheet = new CSSStyleSheet();
          sheet.replaceSync(`
          * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
          p { margin-block-end: 2em !important; }
        `);
          for (const root of [
            document,
            ...hb.all().flatMap(({ shadowRoot }) => shadowRoot ?? []),
          ]) {
            root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
          }
        });
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
        const after = (await clipped()).filter((name) => !before.has(name));
        mkdirSync(resultsDir, { recursive: true });
        writeFileSync(
          join(resultsDir, `text-spacing-${slug(target.label)}.json`),
          JSON.stringify(after, null, 2),
        );
        if (after.length) await annotate(`${after.length} clipped with text spacing`);
      } finally {
        await close();
      }
    },
  );
});
