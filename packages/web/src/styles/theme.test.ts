/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';
import { bandContent } from './band';
import { displayFont } from './shared';

const sources = import.meta.glob<string>(['../**/*.ts', '!../**/*.test.ts', '!../themes/**'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

describe('theme colors', () => {
  it('keeps hex colors in theme files only', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(100);
    const offenders = Object.entries(sources).flatMap(([path, source]) =>
      (source.match(/#[0-9a-f]{3,8}\b/gi) ?? []).map((color) => `${path}: ${color}`),
    );

    expect(offenders).toEqual([]);
  });
});

describe('themes', () => {
  it('are never named outside the theme files, so components only read tokens', () => {
    const offenders = Object.keys(sources).filter((path) =>
      /['"`](festival|spotlight|paper|glass|minimalist)['"`]/.test(sources[path] ?? ''),
    );

    expect(offenders).toEqual([]);
  });

  it('set the display type through displayFont()', () => {
    // Paths in this folder, src/styles, start with './'.
    const offenders = Object.keys(sources).filter(
      (path) => !path.startsWith('./') && sources[path]?.includes('var(--hb-font-display)'),
    );

    expect(offenders).toEqual([]);
  });

  it("put the theme's display tokens over a title's own type", () => {
    const declarations = displayFont('display', '4xl', 1.05, -0.01)
      .cssText.split('\n')
      .map((line) => line.trim())
      .join(' ');

    expect(declarations).toContain(
      'font: var(--hb-display-weight, 800) calc(var(--hb-text-4xl) * var(--hb-display-scale, 1) * var(--hb-font-display-scale, 1)) / calc(1.05 * var(--hb-display-leading, 1)) var(--hb-font-display);',
    );
    expect(declarations).toContain('font-style: var(--hb-display-style, normal);');
    expect(declarations).toContain(
      'letter-spacing: calc(-0.01em + var(--hb-display-tracking, 0em))',
    );
  });

  it("keep the band eyebrow out of the title's text, which a float pushed aside in Chrome", () => {
    const eyebrow = /\.band-title::before \{([^}]*)\}/.exec(bandContent.cssText)?.[1] ?? '';

    expect(eyebrow).toContain('position: absolute;');
    expect(eyebrow).toContain('inset-block-end: 100%;');
    expect(eyebrow).not.toContain('float');
  });
});
