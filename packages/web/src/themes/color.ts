// Conversions between hex colors and OKLCH, where lightness changes keep the hue.

type Rgb = [number, number, number];

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

const parseHex = (hex: string): Rgb => {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
  if (!match?.[1]) throw new Error(`Not a hex color: ${hex}`);
  const digits =
    match[1].length === 3 ? [...match[1]].map((digit) => digit + digit).join('') : match[1];
  return [0, 2, 4].map((start) => parseInt(digits.slice(start, start + 2), 16) / 255) as Rgb;
};

const toHex = (rgb: Rgb) =>
  `#${rgb
    .map((c) =>
      Math.round(Math.min(1, Math.max(0, c)) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;

export interface Oklch {
  l: number;
  c: number;
  h: number;
}

export const hexToOklch = (hex: string): Oklch => {
  const [r, g, b] = parseHex(hex).map(toLinear) as Rgb;
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { l: lightness, c: Math.hypot(a, bb), h: Math.atan2(bb, a) };
};

const oklchToLinear = ({ l, c, h }: Oklch): Rgb => {
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
};

const inGamut = (rgb: Rgb) => rgb.every((c) => c >= -1e-4 && c <= 1 + 1e-4);

/** The sRGB hex color, with chroma lowered until the color fits in sRGB. */
export const oklchToHex = (color: Oklch): string => {
  let { c } = color;
  if (!inGamut(oklchToLinear(color))) {
    let low = 0;
    for (let step = 0; step < 24; step++) {
      const mid = (low + c) / 2;
      if (inGamut(oklchToLinear({ ...color, c: mid }))) low = mid;
      else c = mid;
    }
    c = low;
  }
  return toHex(oklchToLinear({ ...color, c }).map(toGamma) as Rgb);
};

/**
 * A dark scheme version of a site's light color: its hue and chroma at the lightness of the theme's
 * own dark value for the same role.
 */
export const deriveDarkColor = (light: string, themeDark: string): string =>
  oklchToHex({ ...hexToOklch(light), l: hexToOklch(themeDark).l });
