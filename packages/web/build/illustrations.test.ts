import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ILLUSTRATION_COLORS, KEPT_COLORS, themeIllustration } from './illustrations.mjs';

const folder = join(import.meta.dirname, '../src/illustrations');
const illustrations = readdirSync(folder).filter((file) => file.endsWith('.svg'));

describe('themeIllustration', () => {
  it("replaces unDraw's colors with theme colors and keeps skin tones", () => {
    const svg = themeIllustration(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><path fill="#6C63FF" d="M0 0h5v5H0z"/><path fill="#ccc" d="M5 5h5v5H5z"/><circle fill="#ffb9b9" cx="2" cy="8" r="1"/></svg>',
    );

    expect(svg).toContain('fill="var(--hb-illustration-accent)"');
    expect(svg).toContain('fill="var(--hb-color-surface-container-high)"');
    expect(svg).toContain('#ffb9b9');
    expect(svg).toMatch(/^<svg aria-hidden="true" focusable="false"/);
    expect(svg).not.toContain('width="10"');
  });

  it('fails on a color it does not know', () => {
    expect(() =>
      themeIllustration(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><path fill="#123456" d="M0 0h1v1H0z"/></svg>',
      ),
    ).toThrow('Unknown colors: #123456');
  });
});

describe('src/illustrations', () => {
  it.each(illustrations)('%s went through the script and fits the 15KB budget', (file) => {
    const svg = readFileSync(join(folder, file), 'utf8');

    expect(svg).toMatch(/^<svg aria-hidden="true" focusable="false"/);
    const colors = [...svg.matchAll(/#[0-9a-f]{3,6}\b/gi)].map(([hex]) => hex.toLowerCase());
    expect(colors.filter((color) => !KEPT_COLORS.includes(color))).toEqual([]);
    expect(svg.length).toBeLessThanOrEqual(15 * 1024);
  });

  it('maps unDraw colors only to theme variables', () => {
    expect(Object.values(ILLUSTRATION_COLORS).every((value) => value.startsWith('var(--hb-'))).toBe(
      true,
    );
  });
});
