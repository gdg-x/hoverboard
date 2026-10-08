import { describe, expect, it } from 'vitest';
import { generateClassName, variableColor } from './styles';

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
