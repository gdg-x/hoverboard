import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { THEMES } from '../src/themes/index';
import { socialImageDesign, socialImageFonts } from './social-images';
import { resolveTheme, type SiteTheme } from './theme';

const THEME_FONTS = { display: 'unbounded', body: 'inter', mono: 'jetbrains-mono' } as const;

describe('socialImageFonts', () => {
  it("uses the static files of the theme's built-in fonts, Latin first, one family per subset", () => {
    const { fonts, warnings } = socialImageFonts(THEME_FONTS, undefined, '/site');
    const display = fonts.filter(({ role }) => role === 'display');

    expect(warnings).toEqual([]);
    expect(display.map(({ name }) => name).slice(0, 2)).toEqual([
      'display-latin',
      'display-latin-ext',
    ]);
    expect(display.map(({ name }) => name)).toContain('display-cyrillic');
    expect(new Set(display.map(({ weight }) => weight))).toEqual(new Set([700]));
    expect(display.every(({ path }) => /unbounded-[a-z-]+-700-normal\.woff$/.test(path))).toBe(
      true,
    );
    const body = fonts.filter(({ role }) => role === 'body');
    expect(new Set(body.map(({ weight }) => weight))).toEqual(new Set([400, 600]));
    expect(body.every(({ path }) => basename(path).startsWith('inter-'))).toBe(true);
  });

  it("uses the site's own font files that Satori reads", () => {
    const { fonts, warnings } = socialImageFonts(
      THEME_FONTS,
      {
        display: {
          family: 'Brand',
          files: [
            { src: 'fonts/brand.woff2', weight: 700 },
            { src: 'fonts/brand-bold.ttf', weight: 700 },
            { src: 'fonts/brand-bold-ext.otf', weight: '700' },
            { src: 'fonts/brand-italic.woff', weight: 700, style: 'italic' },
            { src: 'fonts/brand-variable.woff', weight: '100 900' },
          ],
        },
      },
      '/site',
    );

    expect(warnings).toEqual([]);
    expect(fonts.filter(({ role }) => role === 'display')).toEqual([
      { role: 'display', name: 'display-0', weight: 700, path: '/site/fonts/brand-bold.ttf' },
      { role: 'display', name: 'display-1', weight: 700, path: '/site/fonts/brand-bold-ext.otf' },
    ]);
  });

  it("falls back to the theme's font, with a warning, for a font Satori can't read", () => {
    const { fonts, warnings } = socialImageFonts(
      THEME_FONTS,
      {
        display: { family: 'Brand', files: [{ src: 'fonts/brand.woff2', weight: '300 900' }] },
        body: { family: 'Service Sans', stylesheet: 'https://fonts.test/sans.css' },
      },
      '/site',
    );

    expect(warnings).toEqual([
      'site.json/theme/fonts/display: share images need a TTF, OTF or WOFF file with a weight such as 400, so they use Unbounded Variable instead of "Brand".',
      'site.json/theme/fonts/body: share images need a TTF, OTF or WOFF file with a weight such as 400, so they use Inter Variable instead of "Service Sans".',
    ]);
    expect(fonts.find(({ role }) => role === 'display')?.path).toMatch(/unbounded-latin-700/);
    expect(fonts.find(({ role }) => role === 'body')?.path).toMatch(/inter-latin-400/);
  });
});

describe('socialImageDesign', () => {
  let publicDir: string;

  beforeEach(() => {
    publicDir = mkdtempSync(join(tmpdir(), 'hoverboard-social-'));
    mkdirSync(join(publicDir, 'images'));
    writeFileSync(join(publicDir, 'images/logo.svg'), '<svg width="2" height="1">light</svg>');
  });

  afterEach(() => rmSync(publicDir, { recursive: true, force: true }));

  const theme = (site: Partial<SiteTheme> = {}) =>
    resolveTheme({
      name: 'festival',
      colorScheme: 'system',
      density: 'default',
      decorations: true,
      ...site,
    });

  const design = (site: Partial<SiteTheme> = {}) =>
    socialImageDesign(theme(site), undefined, { siteDir: '/site', publicDir }).design;

  it("uses the light colors and logo, and the theme's avatar shape", () => {
    expect(design()).toMatchObject({
      colors: THEMES.festival.light,
      avatarRadius: THEMES.festival.style.radiusAvatar,
      logo: '<svg width="2" height="1">light</svg>',
      publicDir,
    });
  });

  it('uses the dark colors and logo on a site with only the dark scheme', () => {
    writeFileSync(join(publicDir, 'images/logo-dark.svg'), '<svg>dark</svg>');

    expect(design({ colorScheme: 'dark' })).toMatchObject({
      colors: THEMES.festival.dark,
      logo: '<svg>dark</svg>',
    });
  });

  it('has no logo when the site has none', () => {
    rmSync(join(publicDir, 'images/logo.svg'));

    expect(design().logo).toBeUndefined();
  });

  it('changes its key with the colors and the logo', () => {
    const { designKey } = design();

    expect(designKey).toMatch(/^[0-9a-f]{8}$/);
    expect(design().designKey).toBe(designKey);
    expect(design({ colors: { primary: '#123456' } }).designKey).not.toBe(designKey);
    writeFileSync(join(publicDir, 'images/logo.svg'), '<svg>new</svg>');
    expect(design().designKey).not.toBe(designKey);
  });
});
