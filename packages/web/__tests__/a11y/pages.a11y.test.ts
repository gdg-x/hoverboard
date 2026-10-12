import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import type Axe from 'axe-core';
import { type Browser, type BrowserContextOptions, chromium } from 'playwright';
import { afterAll, beforeAll, describe, inject, it } from 'vitest';
import { THEMES } from '../../src/themes/index';
import { openPage, resultsDir, slug } from './browser';

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
      const { page, errors, close } = await openPage(browser, sites[scan.site]!.url, scan.path, {
        theme: scan.theme,
        scheme: scan.scheme,
        decorations: scan.variant !== 'decorations off',
        context: VARIANTS[scan.variant],
      });
      try {
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
        const file = join(resultsDir, slug(name(scan)));
        mkdirSync(resultsDir, { recursive: true });
        writeFileSync(`${file}.json`, JSON.stringify(results, null, 2));
        if (failures.length) await page.screenshot({ path: `${file}.png`, fullPage: true });

        expect(errors, 'errors in the page').toEqual([]);
        expect(failures.map(({ rule, help, target }) => `${rule}: ${help} (${target})`)).toEqual(
          [],
        );
      } finally {
        await close();
      }
    },
  );
});
