import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastFailures, contrastRatio, patternAmount } from './contrast';
import { THEMES, themeDeclarations } from './index';
import {
  COLOR_ROLES,
  TONES,
  type ThemeStyle,
  cssColorVar,
  cssStyleVar,
  cssToneVar,
  dots,
} from './tokens';

const PATTERNS = ['heroPattern', 'bandEdge', 'pageTexture'] as const satisfies (keyof ThemeStyle)[];

describe('contrastRatio', () => {
  it('matches the WCAG ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21);
    expect(contrastRatio('#fff', '#000')).toBeCloseTo(21);
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
    expect(contrastRatio('#3557e6', '#3557e6')).toBe(1);
  });

  it('rejects values that are not hex colors', () => {
    expect(() => contrastRatio('red', '#fff')).toThrow('Not a hex color: red');
  });
});

describe.each(Object.entries(THEMES))('%s theme', (_, theme) => {
  it('passes every contrast pair in light and dark', () => {
    expect(contrastFailures(theme)).toEqual([]);
  });

  it('writes every color with a light and a dark value', () => {
    const css = themeDeclarations(theme);

    for (const role of COLOR_ROLES) {
      expect(css).toContain(
        `${cssColorVar(role)}: light-dark(${theme.light[role]}, ${theme.dark[role]});`,
      );
    }
  });

  it('writes every style token and tone', () => {
    const css = themeDeclarations(theme);

    for (const [key, value] of Object.entries(theme.style) as [keyof ThemeStyle, string][]) {
      expect(css).toContain(`${cssStyleVar(key)}: ${value};`);
    }
    for (const tone of TONES) {
      const { background, color, pattern } = theme.tones[tone];
      expect(css).toContain(`${cssToneVar(tone, 'background')}: var(${cssColorVar(background)});`);
      expect(css).toContain(`${cssToneVar(tone, 'color')}: var(${cssColorVar(color)});`);
      expect(css).toContain(`${cssToneVar(tone, 'pattern')}: ${pattern ?? 'none'};`);
    }
  });

  it('draws decorations faintly in the text color, so the contrast check holds', () => {
    const values: [string, string][] = [
      ...PATTERNS.map((key): [string, string] => [key, theme.style[key]]),
      ...TONES.map((tone): [string, string] => [tone, theme.tones[tone].pattern ?? 'none']),
    ];
    for (const [name, value] of values) {
      expect(value, name).not.toContain('var(--hb-color-');
      expect(patternAmount(value), name).toBeLessThanOrEqual(14);
      for (const [url] of value.matchAll(/url\([^)]*\)/g)) {
        expect(url.length, name).toBeLessThanOrEqual(2048);
      }
    }
  });
});

describe('decorations', () => {
  const baseCss = readFileSync(join(import.meta.dirname, '../styles/base.css'), 'utf8');
  const declarations = (selector: string) =>
    baseCss
      .split(selector)
      .slice(1)
      .map((rest) => rest.slice(0, rest.indexOf('}')))
      .join('');

  it.each([
    ['with theme.decorations off', ":root[data-decorations='off'] {"],
    ['in forced colors', '@media (forced-colors: active) {\n  :root {'],
  ])('turn off %s', (_, selector) => {
    for (const key of ['bandEdge', 'pageTexture', 'stickerShape'] as const) {
      expect(declarations(selector)).toContain(`${cssStyleVar(key)}: none !important;`);
    }
    for (const tone of TONES) {
      expect(declarations(selector)).toContain(`${cssToneVar(tone, 'pattern')}: none !important;`);
    }
    expect(declarations(selector)).toContain('--hb-photo-frame: 0 !important;');
  });
});

describe('contrastFailures', () => {
  it("checks the text on each of the theme's tones", () => {
    const { festival } = THEMES;
    const tones = {
      ...festival.tones,
      'accent-3': { background: 'surface', color: 'surface' } as const,
    };

    expect(contrastFailures({ light: festival.light, dark: festival.dark, tones })).toEqual(
      (['light', 'dark'] as const).map((scheme) => ({
        scheme,
        foreground: 'surface',
        background: 'surface',
        ratio: 1,
        min: 4.5,
      })),
    );
  });

  it('checks the text where a pattern darkens or lightens its background', () => {
    const { festival } = THEMES;
    // 4.54:1 on white, and less on the dots.
    const colors = {
      ...festival.light,
      accent3Container: '#ffffff',
      onAccent3Container: '#767676',
    };
    const tones = {
      ...festival.tones,
      'accent-3': { background: 'accent3Container', color: 'onAccent3Container', pattern: dots },
    } as const;

    expect(contrastFailures({ light: colors, dark: colors, tones }, ['light'])).toEqual([
      expect.objectContaining({
        foreground: 'onAccent3Container',
        background: 'accent3Container',
        overPattern: true,
      }),
    ]);
  });
});

describe('glass theme', () => {
  it('turns solid for visitors who reduce transparency', () => {
    const baseCss = readFileSync(join(import.meta.dirname, '../styles/base.css'), 'utf8');
    const reduced = /@media \(prefers-reduced-transparency: reduce\) \{([^@]*?)\n\}/.exec(
      baseCss,
    )?.[1];
    const solid: Partial<ThemeStyle> = {
      pageBackground: 'var(--hb-color-surface)',
      sectionBackground: 'var(--hb-color-surface)',
      tintOpacity: '100%',
      panelBackground: 'var(--hb-color-surface-bright)',
      barBackground: 'var(--hb-color-surface)',
      backdropFilter: 'none',
    };

    for (const [key, value] of Object.entries(solid) as [keyof ThemeStyle, string][]) {
      expect(THEMES.glass.style[key]).not.toBe(value);
      expect(THEMES.festival.style[key]).toBe(value);
      expect(reduced).toContain(`${cssStyleVar(key)}: ${value} !important;`);
    }
  });
});

describe('cssColorVar', () => {
  it('turns role names into kebab-case variables', () => {
    expect(cssColorVar('onPrimaryContainer')).toBe('--hb-color-on-primary-container');
    expect(cssColorVar('accent1Container')).toBe('--hb-color-accent-1-container');
  });
});
