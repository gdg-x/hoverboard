import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyColorScheme,
  COLOR_SCHEME_KEY,
  colorSchemeScript,
  readColorScheme,
} from './color-scheme';

const addThemeColors = () => {
  document.head.innerHTML = `
    <meta name="theme-color" content="#3557e6" media="(prefers-color-scheme: light)" data-light="#3557e6" data-dark="#9db4ff">
    <meta name="theme-color" content="#9db4ff" media="(prefers-color-scheme: dark)" data-light="#3557e6" data-dark="#9db4ff">
  `;
};

const themeColors = () =>
  [...document.querySelectorAll('meta[name="theme-color"]')].map((meta) =>
    meta.getAttribute('content'),
  );

const runScript = () => new Function(colorSchemeScript)();

describe('color scheme', () => {
  beforeEach(addThemeColors);

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-color-scheme');
    vi.restoreAllMocks();
  });

  it('reads the stored choice, and ignores anything else', () => {
    expect(readColorScheme(() => localStorage)).toBeNull();

    localStorage.setItem(COLOR_SCHEME_KEY, 'dark');
    expect(readColorScheme(() => localStorage)).toBe('dark');

    localStorage.setItem(COLOR_SCHEME_KEY, 'sepia');
    expect(readColorScheme(() => localStorage)).toBeNull();
  });

  it('follows the browser when storage throws, as in some private modes', () => {
    expect(
      readColorScheme(() => {
        throw new DOMException('denied', 'SecurityError');
      }),
    ).toBeNull();
  });

  it('locks the page and the toolbar color to a scheme, and unlocks them', () => {
    applyColorScheme(document, 'dark');

    expect(document.documentElement).toHaveAttribute('data-color-scheme', 'dark');
    expect(themeColors()).toEqual(['#9db4ff', '#9db4ff']);

    applyColorScheme(document, null);

    expect(document.documentElement).not.toHaveAttribute('data-color-scheme');
    expect(themeColors()).toEqual(['#3557e6', '#9db4ff']);
  });

  it('applies the stored choice from the inline script', () => {
    localStorage.setItem(COLOR_SCHEME_KEY, 'light');

    runScript();

    expect(document.documentElement).toHaveAttribute('data-color-scheme', 'light');
    expect(themeColors()).toEqual(['#3557e6', '#3557e6']);
  });

  it('leaves the page alone from the inline script without a choice', () => {
    runScript();

    expect(document.documentElement).not.toHaveAttribute('data-color-scheme');
    expect(themeColors()).toEqual(['#3557e6', '#9db4ff']);
  });

  it('applies the choice to pages the client router swaps in', () => {
    localStorage.setItem(COLOR_SCHEME_KEY, 'dark');
    runScript();
    const newDocument = document.implementation.createHTMLDocument();

    document.dispatchEvent(Object.assign(new Event('astro:before-swap'), { newDocument }));

    expect(newDocument.documentElement.getAttribute('data-color-scheme')).toBe('dark');
  });
});
