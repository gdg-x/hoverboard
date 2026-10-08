import { describe, expect, it } from 'vitest';
import { contrastFailures, contrastRatio } from './contrast';
import { REFRESH_THEMES, themeDeclarations } from './index';
import { COLOR_ROLES, cssColorVar } from './tokens';

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

describe.each(Object.entries(REFRESH_THEMES))('%s theme', (_, theme) => {
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
});

describe('cssColorVar', () => {
  it('turns role names into kebab-case variables', () => {
    expect(cssColorVar('onPrimaryContainer')).toBe('--hb-color-on-primary-container');
    expect(cssColorVar('accent1Container')).toBe('--hb-color-accent-1-container');
  });
});
