import { describe, expect, it } from 'vitest';
import { deriveDarkColor, hexToOklch, oklchToHex, tagContainerColors } from './color';
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

describe('tagContainerColors', () => {
  it('keeps chip text readable in both schemes for any hue and gray', () => {
    const colors = ['#9e9e9e', '#78c257', '#2196f3', '#3f51b5', '#e91e63', '#ffeb3b', '#1de9b6'];
    for (const color of [...colors, '#000000', '#ffffff']) {
      for (const { container, onContainer } of Object.values(tagContainerColors(color))) {
        expect(contrastRatio(onContainer, container)).toBeGreaterThan(4.5);
      }
    }
  });

  it('keeps the hue', () => {
    const { light } = tagContainerColors('#2196f3');

    expect(hexToOklch(light.container).h).toBeCloseTo(hexToOklch('#2196f3').h, 1);
  });
});
