import { describe, expect, it, vi, afterEach } from 'vitest';
import { generateClassName, getVariableColor, type ShadyCSSGlobal } from './styles';

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
    (window as { ShadyCSS?: ShadyCSSGlobal }).ShadyCSS = { getComputedStyleValue };

    expect(getVariableColor(element, 'primaryColor')).toBe('#673ab7');
    expect(getComputedStyleValue).toHaveBeenCalledWith(element, '--primary-color');
  });

  it('falls back to another variable when ShadyCSS returns nothing', () => {
    const element = document.createElement('div');
    const getComputedStyleValue = vi.fn().mockReturnValueOnce('').mockReturnValueOnce('#ff5252');
    (window as { ShadyCSS?: ShadyCSSGlobal }).ShadyCSS = { getComputedStyleValue };

    expect(getVariableColor(element, 'primaryColor', 'fallbackColor')).toBe('#ff5252');
    expect(getComputedStyleValue).toHaveBeenCalledWith(element, '--fallback-color');
  });

  it('reads the custom property from the computed style when ShadyCSS is not present', () => {
    const element = document.createElement('div');
    const getPropertyValue = vi.fn().mockReturnValue(' #673ab7 ');
    const getComputedStyle = vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue,
    } as unknown as CSSStyleDeclaration);

    expect(getVariableColor(element, 'primaryColor')).toBe('#673ab7');
    expect(getComputedStyle).toHaveBeenCalledWith(element);
    expect(getPropertyValue).toHaveBeenCalledWith('--primary-color');
  });

  it('returns undefined when the variable is empty and there is no fallback', () => {
    const element = document.createElement('div');

    expect(getVariableColor(element, 'notDefined')).toBeUndefined();
  });

  it('resolves a custom property that is set on the element', () => {
    const element = document.createElement('div');
    element.style.setProperty('--android', '#78c257');
    document.body.append(element);

    expect(getVariableColor(element, 'Android')).toBe('#78c257');

    element.remove();
  });
});
