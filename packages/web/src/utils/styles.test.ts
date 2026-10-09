import { describe, expect, it } from 'vitest';
import { generateClassName, photoTransitionName, tagChipStyle, tagColor } from './styles';

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

describe('tagColor', () => {
  it("references the tag's color, or the outline color", () => {
    expect(tagColor('Android')).toBe('var(--hb-tag-android, var(--hb-color-outline))');
  });
});

describe('photoTransitionName', () => {
  it('makes a CSS name from the kind and id', () => {
    expect(photoTransitionName('speaker', 'ada')).toBe('speaker-ada');
    expect(photoTransitionName('speaker', 12 as unknown as string)).toBe('speaker-12');
    expect(photoTransitionName('previous-speaker', 'jane.doe 2')).toBe(
      'previous-speaker-jane-doe-2',
    );
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
