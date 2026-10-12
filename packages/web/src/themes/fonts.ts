/** The font roles a theme sets, and `theme.fonts` in site.json overrides. */
export const FONT_ROLES = ['display', 'body', 'mono', 'accent'] as const;
export type FontRole = (typeof FONT_ROLES)[number];

/** A theme's fonts. Without an `accent` font, stickers, eyebrows and notes use the display font. */
export type ThemeFonts = Readonly<
  Record<Exclude<FontRole, 'accent'>, BuiltInFontName> & { accent?: BuiltInFontName }
>;

export interface BuiltInFont {
  /** The `@fontsource-variable` package with the font files. */
  package: string;
  /** The family name in the package's CSS. */
  family: string;
  /** The `@capsizecss/metrics` module, for a fallback font with the same size. */
  metrics: string;
  generic: 'sans-serif' | 'serif' | 'monospace';
  /** Its italic files are loaded too, for `displayStyle` or a hero title in italic. */
  italic?: boolean;
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
  oswald: {
    package: '@fontsource-variable/oswald',
    family: 'Oswald Variable',
    metrics: 'oswald',
    generic: 'sans-serif',
  },
  literata: {
    package: '@fontsource-variable/literata',
    family: 'Literata Variable',
    metrics: 'literata',
    generic: 'serif',
    italic: true,
  },
  // Handwriting, only for short labels. `cursive` would fall back to Comic Sans.
  caveat: {
    package: '@fontsource-variable/caveat',
    family: 'Caveat Variable',
    metrics: 'caveat',
    generic: 'sans-serif',
  },
  jost: {
    package: '@fontsource-variable/jost',
    family: 'Jost Variable',
    metrics: 'jost',
    generic: 'sans-serif',
  },
} as const satisfies Record<string, BuiltInFont>;

export type BuiltInFontName = keyof typeof BUILT_IN_FONTS;
