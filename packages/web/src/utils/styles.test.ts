import { describe, expect, it } from 'vitest';
import { generateClassName, tagChipStyle, tagColor, variableColor } from './styles';

describe('generateClassName', () => {
  it('replaces non-word characters with a dash', () => {
    expect(generateClassName('foo bar')).toBe('foo-bar');
  });

  it('inserts a dash between camelCase words and lowercases them', () => {
    expect(generateClassName('primaryColor')).toBe('primary-color');
  });

  it('returns an empty string for undefined', () => {
    expect(generateClassName(undefined)).toBe('');
  });

  it('returns an empty string for an empty string', () => {
    expect(generateClassName('')).toBe('');
  });
});

describe('variableColor', () => {
  it('references the color variable named after the value', () => {
    expect(variableColor('Android')).toBe('var(--android)');
    expect(variableColor('primaryColor')).toBe('var(--primary-color)');
  });

  it('falls back to another color variable', () => {
    expect(variableColor('primaryColor', 'fallbackColor')).toBe(
      'var(--primary-color, var(--fallback-color))',
    );
  });
});

describe('tagColor', () => {
  it("references the tag's color, or the outline color", () => {
    expect(tagColor('Android')).toBe('var(--hb-tag-android, var(--hb-color-outline))');
  });
});

describe('tagChipStyle', () => {
  it("sets the chip colors to the tag's derived colors, with theme fallbacks", () => {
    expect(tagChipStyle('Web')).toEqual({
      '--hb-chip-background': 'var(--hb-tag-web-container, var(--hb-color-surface-container))',
      '--hb-chip-color': 'var(--hb-on-tag-web-container, var(--hb-color-on-surface))',
      '--hb-chip-border-color': 'transparent',
    });
  });
});
