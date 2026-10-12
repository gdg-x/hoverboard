import { TONES, type ColorRole, type ColorSet, type Theme } from './tokens';

const channel = (value: number) => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const rgb = (hex: string) => {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
  if (!match?.[1]) throw new Error(`Not a hex color: ${hex}`);
  const digits =
    match[1].length === 3 ? [...match[1]].map((digit) => digit + digit).join('') : match[1];
  return [0, 2, 4].map((start) => parseInt(digits.slice(start, start + 2), 16));
};

const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex).map(channel);
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
};

/** `amount` (0 to 1) of `top` over `bottom`, as `color-mix(in srgb, ...)` over an opaque color. */
const mix = (bottom: string, top: string, amount: number) => {
  const [a, b] = [rgb(bottom), rgb(top)];
  return `#${a
    .map((value, index) =>
      Math.round(value + ((b[index] ?? value) - value) * amount)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
};

/** The WCAG 2 contrast ratio of two hex colors, from 1 to 21. */
export const contrastRatio = (foreground: string, background: string) => {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
};

/** Text needs 4.5:1. UI parts, outlines and focus rings need 3:1. */
export const CONTRAST_PAIRS: readonly [
  foreground: ColorRole,
  background: ColorRole,
  min: number,
][] = [
  ['onPrimary', 'primary', 4.5],
  ['onPrimaryContainer', 'primaryContainer', 4.5],
  ['onSecondary', 'secondary', 4.5],
  ['onSurface', 'surface', 4.5],
  ['onSurface', 'surfaceDim', 4.5],
  ['onSurface', 'surfaceBright', 4.5],
  ['onSurface', 'surfaceContainer', 4.5],
  ['onSurface', 'surfaceContainerHigh', 4.5],
  // The festival footer: surface text on an ink band.
  ['surface', 'ink', 4.5],
  ['onSurfaceVariant', 'surface', 4.5],
  ['onSurfaceVariant', 'surfaceContainer', 4.5],
  ['primary', 'surface', 4.5],
  ['primary', 'surfaceBright', 4.5],
  ['error', 'surface', 4.5],
  ['onError', 'error', 4.5],
  ['success', 'surface', 3],
  ['outline', 'surface', 3],
  ['ink', 'surface', 3],
  ['focus', 'surface', 3],
  ['onAccent1Container', 'accent1Container', 4.5],
  ['onAccent2Container', 'accent2Container', 4.5],
  ['onAccent3Container', 'accent3Container', 4.5],
  ['onAccent4Container', 'accent4Container', 4.5],
];

export interface ContrastResult {
  foreground: ColorRole;
  background: ColorRole;
  ratio: number;
  min: number;
  /** Measured where the background's pattern is, in the text color. */
  overPattern?: boolean;
}

export const contrastResults = (colors: ColorSet, tones?: Theme['tones']): ContrastResult[] => {
  const tonePairs = TONES.map((tone) => tones?.[tone])
    .filter((tone) => tone !== undefined)
    .filter(
      ({ background, color }) =>
        !CONTRAST_PAIRS.some(([foreground, other]) => foreground === color && other === background),
    )
    .map(({ background, color }): (typeof CONTRAST_PAIRS)[number] => [color, background, 4.5]);
  return [...CONTRAST_PAIRS, ...tonePairs].map(([foreground, background, min]) => ({
    foreground,
    background,
    ratio: contrastRatio(colors[foreground], colors[background]),
    min,
  }));
};

/** How much of the text color a pattern mixes into its background, from 0 to 100. */
export const patternAmount = (pattern = 'none') =>
  Math.max(0, ...[...pattern.matchAll(/currentColor ([\d.]+)%/g)].map((match) => Number(match[1])));

/**
 * Text on each tone, measured on a pattern's lines, the worst case. Heroes have the accent tones and
 * `heroPattern`, bands have their tone's own pattern.
 */
export const patternResults = (
  colors: ColorSet,
  tones: Theme['tones'],
  heroPattern?: string,
): ContrastResult[] =>
  TONES.flatMap((tone) => {
    const { background, color, pattern } = tones[tone];
    const amount = Math.max(
      patternAmount(pattern),
      tone === 'surface' ? 0 : patternAmount(heroPattern),
    );
    if (!amount) return [];
    const behind = mix(colors[background], colors[color], amount / 100);
    return [
      {
        foreground: color,
        background,
        ratio: contrastRatio(colors[color], behind),
        min: 4.5,
        overPattern: true,
      },
    ];
  });

/**
 * Every pair below its minimum, in the given schemes, with the text on each of the theme's tones and
 * their patterns.
 */
export const contrastFailures = (
  theme: Pick<Theme, 'light' | 'dark'> & Partial<Pick<Theme, 'tones' | 'style'>>,
  schemes: readonly ('light' | 'dark')[] = ['light', 'dark'],
) =>
  schemes.flatMap((scheme) =>
    [
      ...contrastResults(theme[scheme], theme.tones),
      ...(theme.tones ? patternResults(theme[scheme], theme.tones, theme.style?.heroPattern) : []),
    ]
      .filter(({ ratio, min }) => ratio < min)
      .map((result) => ({ scheme, ...result })),
  );
