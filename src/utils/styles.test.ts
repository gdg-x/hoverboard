import { describe, expect, it, vi, afterEach } from 'vitest';
import { TempAny } from '../temp-any';
import { generateClassName, getVariableColor } from './styles';

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

describe('getVariableColor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as { ShadyCSS?: unknown }).ShadyCSS;
  });

  it('uses ShadyCSS.getComputedStyleValue when ShadyCSS is present', () => {
    const element = document.createElement('div');
    const getComputedStyleValue = vi.fn().mockReturnValue('#673ab7');
    (window as TempAny).ShadyCSS = { getComputedStyleValue };

    expect(getVariableColor(element, 'primaryColor')).toBe('#673ab7');
    expect(getComputedStyleValue).toHaveBeenCalledWith(element, '--primary-color');
  });

  it('falls back to another variable when ShadyCSS returns nothing', () => {
    const element = document.createElement('div');
    const getComputedStyleValue = vi.fn().mockReturnValueOnce('').mockReturnValueOnce('#ff5252');
    (window as TempAny).ShadyCSS = { getComputedStyleValue };

    expect(getVariableColor(element, 'primaryColor', 'fallbackColor')).toBe('#ff5252');
    expect(getComputedStyleValue).toHaveBeenCalledWith(element, '--fallback-color');
  });

  it('uses window.getComputedStyle when ShadyCSS is not present', () => {
    const element = document.createElement('div');
    const getComputedStyle = vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      color: '#673ab7',
    } as unknown as CSSStyleDeclaration);

    expect(getVariableColor(element, 'primaryColor')).toStrictEqual({ color: '#673ab7' });
    expect(getComputedStyle).toHaveBeenCalledWith(element, '--primary-color');
  });
});
