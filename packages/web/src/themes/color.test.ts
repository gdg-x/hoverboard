import { describe, expect, it } from 'vitest';
import { deriveDarkColor, hexToOklch, oklchToHex } from './color';
import { contrastRatio } from './contrast';
import { festival } from './festival';

describe('OKLCH', () => {
  it('converts hex colors there and back', () => {
    for (const hex of ['#000000', '#ffffff', '#3557e6', '#d93025', '#f6b400', '#188038']) {
      expect(oklchToHex(hexToOklch(hex))).toBe(hex);
    }
  });

  it('matches known OKLCH values', () => {
    expect(hexToOklch('#ffffff').l).toBeCloseTo(1, 3);
    expect(hexToOklch('#000000').l).toBeCloseTo(0, 3);
    expect(hexToOklch('#ff0000')).toMatchObject({ l: expect.closeTo(0.628, 3) as number });
  });

  it('lowers chroma to stay in sRGB', () => {
    expect(oklchToHex({ l: 0.9, c: 0.4, h: hexToOklch('#0000ff').h })).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('deriveDarkColor', () => {
  it('keeps the hue at the lightness of the theme dark color', () => {
    const pink = '#e91e63';
    const dark = deriveDarkColor(pink, festival.dark.primary);

    expect(hexToOklch(dark).l).toBeCloseTo(hexToOklch(festival.dark.primary).l, 2);
    expect(hexToOklch(dark).h).toBeCloseTo(hexToOklch(pink).h, 1);
    // Readable as text on the dark surface, like the theme's own dark primary.
    expect(contrastRatio(dark, festival.dark.surface)).toBeGreaterThan(4.5);
  });
});
