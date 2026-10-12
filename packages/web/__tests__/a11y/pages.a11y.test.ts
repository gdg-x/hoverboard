import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type Axe from 'axe-core';
import { type Browser, type BrowserContextOptions, chromium } from 'playwright';
import { afterAll, beforeAll, describe, inject, it } from 'vitest';
import { THEMES } from '../../src/themes/index';

interface Scan {
  site: string;
  path: string;
  theme: string;
  scheme: 'light' | 'dark';
  variant: keyof typeof VARIANTS;
}

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// Visitor settings, checked on a few pages in the default theme.
const VARIANTS = {
  default: {},
  'decorations off': {},
  'forced colors': { forcedColors: 'active' },
  'reduced motion': { reducedMotion: 'reduce' },
  '320px': { viewport: { width: 320, height: 640 } },
} as const satisfies Record<string, BrowserContextOptions>;

const resultsDir = fileURLToPath(new URL('../../test-results/a11y', import.meta.url));
const axeSource = readFileSync(
  createRequire(import.meta.url).resolve('axe-core/axe.min.js'),
  'utf8',
);
const sites = inject('a11ySites');

const scans: Scan[] = [
  ...Object.keys(THEMES).flatMap((theme) =>
    (['light', 'dark'] as const).flatMap((scheme) =>
      sites['demo']!.paths.map((path): Scan => ({
        site: 'demo',
        path,
        theme,
        scheme,
        variant: 'default',
      })),
    ),
  ),
  ...(['decorations off', 'forced colors', 'reduced motion', '320px'] as const).flatMap((variant) =>
    sites['demo']!.paths.slice(0, 3).map((path): Scan => ({
      site: 'demo',
      path,
      theme: 'festival',
      scheme: 'light',
      variant,
    })),
  ),
  ...sites['minimal']!.paths.map((path): Scan => ({
    site: 'minimal',
    path,
    theme: 'spotlight',
    scheme: 'light',
    variant: 'default',
  })),
];

const name = ({ site, path, theme, scheme, variant }: Scan) =>
  `${site} ${path} in ${theme} ${scheme}${variant === 'default' ? '' : `, ${variant}`}`;

/**
 * Runs in the page: waits until no element in any shadow root is undefined or has an update pending,
 * then until nothing has changed for half a second, since sign-in state and lazy blocks arrive late.
 */
const settle = async () => {
  type Updating = Element & { updateComplete?: Promise<unknown>; isUpdatePending?: boolean };
  const all = (root: ParentNode): Updating[] =>
    [...root.querySelectorAll('*')].flatMap((element) =>
      element.shadowRoot ? [element, ...all(element.shadowRoot)] : [element],
    );
  const updates = async () => {
    for (let round = 0; round < 20; round++) {
      const elements = all(document);
      const waiting = elements.filter(
        (element) => element.isUpdatePending || element.matches(':not(:defined)'),
      );
      if (!waiting.length && round > 0) return;
      await Promise.allSettled(elements.flatMap((element) => element.updateComplete ?? []));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  };
  const quiet = (ms: number, max: number) =>
    new Promise<void>((resolve) => {
      let timer = setTimeout(done, ms);
      const observer = new MutationObserver(() => {
        clearTimeout(timer);
        timer = setTimeout(done, ms);
      });
      const roots = [document, ...all(document).flatMap(({ shadowRoot }) => shadowRoot ?? [])];
      for (const root of roots) {
        observer.observe(root, {
          subtree: true,
          childList: true,
          attributes: true,
          characterData: true,
        });
      }
      const limit = setTimeout(done, max);
      function done() {
        clearTimeout(timer);
        clearTimeout(limit);
        observer.disconnect();
        resolve();
      }
    });
  await updates();
  await quiet(500, 5000);
  await updates();
};

let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch();
});

afterAll(async () => {
  await browser.close();
});

describe.concurrent('axe on the built site', () => {
  it.for(scans.map((scan) => ({ ...scan, label: name(scan) })))(
    'finds no violations on $label',
    async (scan, { expect }) => {
      const { url } = sites[scan.site]!;
      const context = await browser.newContext({
        serviceWorkers: 'block',
        ...VARIANTS[scan.variant],
      });
      try {
        // Only the site itself: no maps, videos or Firebase backends, so every run is the same.
        await context.route(
          (requested) => requested.origin !== url,
          (route) => route.abort(),
        );
        await context.addInitScript(
          ({ theme, scheme, decorations }) => {
            localStorage.setItem('hb-demo-theme', theme);
            localStorage.setItem('hb-color-scheme', scheme);
            if (decorations) localStorage.setItem('hb-demo-decorations', decorations);
          },
          {
            theme: scan.theme,
            scheme: scan.scheme,
            decorations: scan.variant === 'decorations off' ? 'off' : '',
          },
        );
        const page = await context.newPage();
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
        await page.goto(`${url}${scan.path}`, { waitUntil: 'load' });
        // Every island hydrated, and the blocks that load when scrolled to.
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForFunction(
          () => !document.querySelector('astro-island[ssr], :not(:defined)'),
        );
        await page.evaluate(settle);
        await page.evaluate(() => window.scrollTo(0, 0));

        await page.evaluate(axeSource);
        const results = await page.evaluate(
          async ({ tags, forcedColors }) => {
            const { axe } = window as unknown as { axe: typeof Axe };
            const { violations } = await axe.run(document, {
              runOnly: { type: 'tag', values: [...tags, 'best-practice'] },
              // Forced colors replace the page's colors with the visitor's, so axe's ratios are moot.
              rules: forcedColors ? { 'color-contrast': { enabled: false } } : {},
              resultTypes: ['violations'],
            });
            return violations.flatMap(({ id, help, tags: ruleTags, nodes }) =>
              nodes.map(({ target }) => ({
                rule: id,
                help,
                target: target.flat().join(' >>> '),
                wcag: ruleTags.some((tag) => tags.includes(tag)),
              })),
            );
          },
          { tags: WCAG_AA, forcedColors: scan.variant === 'forced colors' },
        );

        // Best practice is only reported. To accept a WCAG violation, turn its rule off above, with why.
        const failures = results.filter(({ wcag }) => wcag);
        const slug = name(scan).replace(/[^\w]+/g, '-');
        mkdirSync(resultsDir, { recursive: true });
        writeFileSync(join(resultsDir, `${slug}.json`), JSON.stringify(results, null, 2));
        if (failures.length) {
          await page.screenshot({ path: join(resultsDir, `${slug}.png`), fullPage: true });
        }

        expect(errors, 'errors in the page').toEqual([]);
        expect(failures.map(({ rule, help, target }) => `${rule}: ${help} (${target})`)).toEqual(
          [],
        );
      } finally {
        await context.close();
      }
    },
  );
});
