import type { ColorRole, ColorSet, Theme } from './tokens';

const channel = (value: number) => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string) => {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
  if (!match?.[1]) throw new Error(`Not a hex color: ${hex}`);
  const digits =
    match[1].length === 3 ? [...match[1]].map((digit) => digit + digit).join('') : match[1];
  const [r, g, b] = [0, 2, 4].map((start) => channel(parseInt(digits.slice(start, start + 2), 16)));
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
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
}

export const contrastResults = (colors: ColorSet): ContrastResult[] =>
  CONTRAST_PAIRS.map(([foreground, background, min]) => ({
    foreground,
    background,
    ratio: contrastRatio(colors[foreground], colors[background]),
    min,
  }));

/** Every pair below its minimum, in the given schemes. */
export const contrastFailures = (
  theme: Pick<Theme, 'light' | 'dark'>,
  schemes: readonly ('light' | 'dark')[] = ['light', 'dark'],
) =>
  schemes.flatMap((scheme) =>
    contrastResults(theme[scheme])
      .filter(({ ratio, min }) => ratio < min)
      .map((result) => ({ scheme, ...result })),
  );
