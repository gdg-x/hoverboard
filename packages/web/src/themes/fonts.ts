/** The font roles a theme sets, and `theme.fonts` in site.json overrides. */
export const FONT_ROLES = ['display', 'body', 'mono'] as const;
export type FontRole = (typeof FONT_ROLES)[number];

export interface BuiltInFont {
  /** The `@fontsource-variable` package with the font files. */
  package: string;
  /** The family name in the package's CSS. */
  family: string;
  /** The `@capsizecss/metrics` module, for a fallback font with the same size. */
  metrics: string;
  generic: 'sans-serif' | 'monospace';
}

/** Self-hosted fonts that themes can use. */
export const BUILT_IN_FONTS = {
  unbounded: {
    package: '@fontsource-variable/unbounded',
    family: 'Unbounded Variable',
    metrics: 'unbounded',
    generic: 'sans-serif',
  },
  inter: {
    package: '@fontsource-variable/inter',
    family: 'Inter Variable',
    metrics: 'inter',
    generic: 'sans-serif',
  },
  'jetbrains-mono': {
    package: '@fontsource-variable/jetbrains-mono',
    family: 'JetBrains Mono Variable',
    metrics: 'jetBrainsMono',
    generic: 'monospace',
  },
} as const satisfies Record<string, BuiltInFont>;

export type BuiltInFontName = keyof typeof BUILT_IN_FONTS;
