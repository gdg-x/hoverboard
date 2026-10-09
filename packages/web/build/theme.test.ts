import { describe, expect, it } from 'vitest';
import { hexToOklch, tagContainerColors } from '../src/themes/color';
import { festival } from '../src/themes/festival';
import {
  darkLogoCss,
  demoThemesCss,
  type SiteTheme,
  heroPhotoErrors,
  resolveTheme,
  themeCss,
  themeErrors,
} from './theme';

const siteTheme = (theme: Partial<SiteTheme> = {}): SiteTheme => ({
  name: 'festival',
  colorScheme: 'system',
  density: 'default',
  decorations: true,
  ...theme,
});

describe('resolveTheme', () => {
  it('gives a light color without a dark one a dark version with the same hue', () => {
    const theme = resolveTheme(siteTheme({ colors: { primary: '#c2185b' } }));

    expect(theme.light.primary).toBe('#c2185b');
    expect(hexToOklch(theme.dark.primary).h).toBeCloseTo(hexToOklch('#c2185b').h, 1);
    expect(hexToOklch(theme.dark.primary).l).toBeCloseTo(hexToOklch(festival.dark.primary).l, 2);
  });

  it('keeps the site dark colors', () => {
    const theme = resolveTheme(
      siteTheme({ colors: { primary: '#c2185b' }, darkColors: { primary: '#ff8fb8' } }),
    );

    expect(theme.dark.primary).toBe('#ff8fb8');
  });

  it('uses a light scrim as is, because the theme scrim is not a hex color', () => {
    const theme = resolveTheme(siteTheme({ colors: { scrim: '#00000080' } }));

    expect(theme.dark.scrim).toBe(festival.dark.scrim);
  });
});

describe('themeErrors', () => {
  it('checks only the schemes the site uses', () => {
    const lowContrast = { onSurface: '#eeeeee' };

    expect(
      themeErrors(resolveTheme(siteTheme({ colorScheme: 'dark', colors: lowContrast }))),
    ).toEqual([]);
    expect(
      themeErrors(resolveTheme(siteTheme({ colorScheme: 'light', colors: lowContrast }))),
    ).toContainEqual(
      expect.stringMatching(
        /^site\.json\/theme: onSurface on surface has a contrast of 1\.\d+:1 in the light scheme, and needs 4\.5:1\. Change theme\.colors\.$/,
      ),
    );
  });
});

describe('demoThemesCss', () => {
  it("writes every built-in theme with the site's colors under a data-theme selector", () => {
    const css = demoThemesCss(siteTheme({ colors: { primary: '#c2185b' } }));

    expect(css).toContain(":root[data-theme='festival'] {");
    expect(css).toContain(":root[data-theme='spotlight'] {");
    expect(css).toMatch(
      /\[data-theme='spotlight'\] \{[^}]*--hb-color-primary: light-dark\(#c2185b,/,
    );
    expect(css).toMatch(/\[data-theme='spotlight'\] \{[^}]*--hb-border-width: 1px;/);
  });
});

describe('themeCss', () => {
  it('writes every color with light-dark(), the density and the tag colors', () => {
    const css = themeCss(resolveTheme(siteTheme({ density: 'compact' })), { android: '#78c257' });

    expect(css).toContain('color-scheme: light dark;');
    expect(css).toContain('--hb-density: 0.75;');
    expect(css).toContain(
      `--hb-color-surface: light-dark(${festival.light.surface}, ${festival.dark.surface});`,
    );
    expect(css).toContain('--hb-radius-l: 28px;');
    expect(css).not.toContain('--default-primary-color');
    expect(css).not.toContain('--android:');
    expect(css).toContain('--hb-tag-android: #78c257;');
    expect(css).toMatch(/--hb-tag-android-container: light-dark\(#[0-9a-f]{6}, #[0-9a-f]{6}\);/);
    expect(css).toMatch(/--hb-on-tag-android-container: light-dark\(#[0-9a-f]{6}, #[0-9a-f]{6}\);/);
  });

  it('keeps a tag color that is not hex as is, with no containers', () => {
    const css = themeCss(resolveTheme(siteTheme()), { web: 'rebeccapurple' });

    expect(css).toContain('--hb-tag-web: rebeccapurple;');
    expect(css).not.toContain('--hb-tag-web-container');
  });

  it('locks the scheme, and falls back to it without light-dark()', () => {
    const css = themeCss(resolveTheme(siteTheme({ colorScheme: 'dark' })));

    expect(css).toContain('color-scheme: dark;');
    expect(css).toContain(
      `@supports not (color: light-dark(#000, #fff)) {\n:root {\n--hb-color-primary: ${festival.dark.primary};`,
    );
  });

  it('gives tag containers the locked scheme without light-dark()', () => {
    const css = themeCss(resolveTheme(siteTheme({ colorScheme: 'dark' })), { web: '#2196f3' });
    const { dark } = tagContainerColors('#2196f3');

    expect(css.slice(css.indexOf('@supports'))).toContain(
      `--hb-tag-web-container: ${dark.container};`,
    );
  });
});

describe('heroPhotoErrors', () => {
  it('passes with the built-in scrims', () => {
    expect(heroPhotoErrors(resolveTheme(siteTheme()))).toEqual([]);
    expect(heroPhotoErrors(resolveTheme(siteTheme({ name: 'spotlight' })))).toEqual([]);
  });

  it('fails with a scrim too light for the text over a white photo', () => {
    for (const scrim of ['rgb(0 0 0 / 20%)', 'rgba(0, 0, 0, 0.2)', '#0003']) {
      expect(heroPhotoErrors(resolveTheme(siteTheme({ darkColors: { scrim } })))).toEqual([
        expect.stringContaining('needs 4.5:1. Make theme.darkColors.scrim darker.'),
      ]);
    }
  });
});

describe('darkLogoCss', () => {
  it('uses the dark logo in the dark scheme', () => {
    expect(darkLogoCss(true)).toContain('--hb-logo-dark-image: url("/images/logo-dark.svg");');
    expect(darkLogoCss(true)).toContain('--hb-logo-dark-name-display: none;');
  });

  it('shows the short name instead without a dark logo', () => {
    expect(darkLogoCss(false)).toContain('--hb-logo-dark-display: none;');
    expect(darkLogoCss(false)).toContain('--hb-logo-dark-name-display: inline;');
  });
});
