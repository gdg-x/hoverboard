import { describe, expect, it } from 'vitest';
import { hexToOklch } from '../src/themes/color';
import { festival } from '../src/themes/festival';
import { type SiteTheme, resolveTheme, themeCss, themeErrors } from './theme';

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

describe('themeCss', () => {
  it('writes every color with light-dark(), the density and the old variable names', () => {
    const css = themeCss(resolveTheme(siteTheme({ density: 'compact' })), { android: '#78c257' });

    expect(css).toContain('color-scheme: light dark;');
    expect(css).toContain('--hb-density: 0.75;');
    expect(css).toContain(
      `--hb-color-surface: light-dark(${festival.light.surface}, ${festival.dark.surface});`,
    );
    expect(css).toContain('--hb-radius-l: 28px;');
    expect(css).toContain('--default-primary-color: var(--hb-color-primary);');
    expect(css).toContain('--android: #78c257;');
  });

  it('locks the scheme, and falls back to it without light-dark()', () => {
    const css = themeCss(resolveTheme(siteTheme({ colorScheme: 'dark' })));

    expect(css).toContain('color-scheme: dark;');
    expect(css).toContain(
      `@supports not (color: light-dark(#000, #fff)) {\n:root {\n--hb-color-primary: ${festival.dark.primary};`,
    );
  });
});
