import fs from 'node:fs';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { festival } from '../src/themes/festival';
import { BUILT_IN_FONTS, type BuiltInFontName } from '../src/themes/fonts';
import { glass } from '../src/themes/glass';
import { paper } from '../src/themes/paper';
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
    expect(css(parts)).toContain('--hb-font-display-scale:0.9;');
    expect(parts.stylesheets).toEqual(['https://use.typekit.net/abc.css']);
    expect(parts.preload).toBe(join(dir, 'fonts/brand.woff2'));
  });

  it('uses the display font for the accent role, unless the theme or the site sets one', async () => {
    const dir = siteDir();
    const display = await fontModuleParts(festival.fonts, undefined, dir);
    const theme = await fontModuleParts({ ...festival.fonts, accent: 'caveat' }, undefined, dir);
    const site = await fontModuleParts(
      { ...festival.fonts, accent: 'caveat' },
      { accent: { family: 'Marker Felt' } },
      dir,
    );

    expect(css(display)).toContain('--hb-font-accent:var(--hb-font-display);');
    expect(css(theme)).toContain(
      '--hb-font-accent:"Caveat Variable", "Caveat Variable Fallback", Arial, sans-serif;',
    );
    expect(css(site)).toContain('--hb-font-accent:Marker Felt;');
    expect(css(site)).not.toContain('Caveat');
  });

  it('loads a font that two roles use once', async () => {
    const parts = await fontModuleParts(glass.fonts, undefined, siteDir());

    expect(css(parts).match(/inter-latin-wght-normal/g)).toHaveLength(1);
    expect(css(parts)).toContain('--hb-font-display:"Inter Variable"');
  });

  it('falls back to a font of the same kind', async () => {
    const parts = await fontModuleParts(
      { ...festival.fonts, display: 'literata' },
      undefined,
      siteDir(),
    );

    expect(css(parts)).toContain(
      '--hb-font-display:"Literata Variable", "Literata Variable Fallback", "Times New Roman", serif;',
    );
  });

  it('loads italic files only for fonts that have them', async () => {
    const parts = await fontModuleParts(
      { ...festival.fonts, display: 'literata' },
      undefined,
      siteDir(),
    );

    expect(css(parts)).toMatch(
      /font-family:"Literata Variable";font-display:swap;font-weight:200 900;font-style:italic;unicode-range:[^;]+;src:url\(\[@fontsource-variable\/literata\/files\/literata-latin-wght-italic\.woff2\]\)/,
    );
    expect(css(parts)).not.toMatch(/"(Inter|JetBrains Mono) Variable";[^}]*font-style:italic/);
  });

  it('has the files of every built-in font', async () => {
    for (const name of Object.keys(BUILT_IN_FONTS) as BuiltInFontName[]) {
      const parts = await fontModuleParts(
        { display: name, body: name, mono: name },
        undefined,
        siteDir(),
      );
      const urls = parts.css.flatMap((part) => (typeof part === 'string' ? [] : [part.url]));

      expect(urls.some((url) => url.includes('-cyrillic-'))).toBe(true);
      for (const url of urls) expect(require.resolve(url)).toBeTruthy();
    }
  });

  it("adds every demo theme's fonts, except the roles the site sets", async () => {
    const parts = await fontModuleParts(
      festival.fonts,
      { mono: { family: 'ui-monospace' } },
      siteDir(),
      { festival: festival.fonts, glass: glass.fonts, paper: { ...paper.fonts, accent: 'caveat' } },
    );

    expect(css(parts)).toContain(
      ':root[data-theme=\'glass\']{--hb-font-display:"Inter Variable", "Inter Variable Fallback", Arial, sans-serif;',
    );
    expect(css(parts)).toContain('@font-face{font-family:"Caveat Variable"');
    expect(css(parts)).toMatch(/:root\[data-theme='paper'\]\{[^}]*--hb-font-accent:"Caveat/);
    expect(css(parts)).toMatch(
      /:root\[data-theme='festival'\]\{[^}]*--hb-font-accent:var\(--hb-font-display\);/,
    );
    expect(css(parts)).not.toMatch(/data-theme[^}]*--hb-font-mono/);
    expect(parts.preload).toBe(
      '@fontsource-variable/unbounded/files/unbounded-latin-wght-normal.woff2',
    );
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
