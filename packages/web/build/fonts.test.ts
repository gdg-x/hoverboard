import fs from 'node:fs';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { festival } from '../src/themes/festival';
import { fontModuleCode, fontModuleParts, fontProblems } from './fonts';

const require = createRequire(import.meta.url);
const unboundedFiles = join(
  dirname(require.resolve('@fontsource-variable/unbounded/package.json')),
  'files',
);
const dirsToClean: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** A config folder with Unbounded's Latin file as a site font. */
const siteDir = () => {
  const dir = mkdtempSync(join(tmpdir(), 'hoverboard-fonts-'));
  dirsToClean.push(dir);
  mkdirSync(join(dir, 'fonts'));
  copyFileSync(
    join(unboundedFiles, 'unbounded-latin-wght-normal.woff2'),
    join(dir, 'fonts/brand.woff2'),
  );
  return dir;
};

const brand = { family: 'Brand', files: [{ src: 'fonts/brand.woff2', weight: '200 900' }] };

describe('fontProblems', () => {
  it('rejects files that are not in packages/config', () => {
    const fonts = {
      body: { family: 'Brand', files: [{ src: 'fonts/missing.woff2', weight: 400 }] },
    };

    expect(fontProblems(fonts, siteDir(), [])).toEqual({
      errors: [
        'site.json/theme/fonts/body/files/0/src: "fonts/missing.woff2" is not in packages/config',
      ],
      warnings: [],
    });
  });

  it('warns about characters the font does not have', () => {
    expect(fontProblems({ display: brand }, siteDir(), ['DevFest', 'ДевФест'])).toEqual({
      errors: [],
      warnings: [
        'site.json/theme/fonts/display: "Brand" has no glyphs for Д е в Ф с т. Browsers show them in another font.',
      ],
    });
  });

  it('warns about large files', () => {
    const dir = siteDir();
    const statSync = fs.statSync.bind(fs);
    vi.spyOn(fs, 'statSync').mockImplementation(((path: string) => ({
      ...statSync(path),
      size: 200 * 1024,
    })) as typeof fs.statSync);

    expect(fontProblems({ display: brand }, dir, ['DevFest']).warnings).toEqual([
      'site.json/theme/fonts/display: the files are 200KB, more than 150KB. Visitors download them on their first visit.',
    ]);
  });
});

describe('fontModuleParts', () => {
  const css = (parts: Awaited<ReturnType<typeof fontModuleParts>>) =>
    parts.css.map((part) => (typeof part === 'string' ? part : `[${part.url}]`)).join('');

  it('loads the theme fonts, with fallbacks of the same size', async () => {
    const parts = await fontModuleParts(festival.fonts, undefined, siteDir());

    expect(css(parts)).toContain(
      '@font-face{font-family:"Inter Variable";font-display:swap;font-weight:100 900;font-style:normal;unicode-range:U+0000-00FF',
    );
    expect(css(parts)).toContain('font-family: "JetBrains Mono Variable Fallback";');
    expect(css(parts)).toContain(
      '--hb-font-mono:"JetBrains Mono Variable", "JetBrains Mono Variable Fallback", "Courier New", monospace;',
    );
    expect(parts.preload).toBe(
      '@fontsource-variable/unbounded/files/unbounded-latin-wght-normal.woff2',
    );
  });

  it('uses the site fonts instead of the theme fonts of the same role', async () => {
    const dir = siteDir();
    const parts = await fontModuleParts(
      festival.fonts,
      {
        display: { ...brand, scale: 0.9 },
        body: { family: 'Brand Sans', stylesheet: 'https://use.typekit.net/abc.css' },
        mono: { family: 'ui-monospace, Menlo, monospace' },
      },
      dir,
    );

    expect(css(parts)).toContain(
      `@font-face{font-family:"Brand";font-display:swap;font-weight:200 900;font-style:normal;src:url([${join(dir, 'fonts/brand.woff2')}])}`,
    );
    expect(css(parts)).not.toContain('Unbounded');
    expect(css(parts)).not.toContain('Inter');
    expect(css(parts)).toContain('--hb-font-body:"Brand Sans", sans-serif;');
    expect(css(parts)).toContain('--hb-font-mono:ui-monospace, Menlo, monospace;');
    expect(css(parts)).toContain('--hb-display-scale:0.9;');
    expect(parts.stylesheets).toEqual(['https://use.typekit.net/abc.css']);
    expect(parts.preload).toBe(join(dir, 'fonts/brand.woff2'));
  });
});

describe('fontModuleCode', () => {
  it('imports each file once with ?url', () => {
    expect(
      fontModuleCode({
        css: ['a{src:url(', { url: 'x.woff2' }, ')}b{src:url(', { url: 'x.woff2' }, ')}'],
        stylesheets: [],
        preload: 'x.woff2',
      }),
    ).toBe(
      [
        'import font0 from "x.woff2?url&no-inline";',
        'export const fontCss = "a{src:url(" + font0 + ")}b{src:url(" + font0 + ")}";',
        'export const fontStylesheets = [];',
        'export const preloadFont = font0;',
        '',
      ].join('\n'),
    );
  });
});
