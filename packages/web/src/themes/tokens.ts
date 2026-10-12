import type { ThemeFonts } from './fonts';

/** Color roles of the themes, by the name `site.json` uses in `theme.colors` and `theme.darkColors`. */
export const COLOR_ROLES = [
  'primary',
  'onPrimary',
  'primaryContainer',
  'onPrimaryContainer',
  'secondary',
  'onSecondary',
  'surface',
  'surfaceDim',
  'surfaceBright',
  'surfaceContainer',
  'surfaceContainerHigh',
  'onSurface',
  'onSurfaceVariant',
  'outline',
  'outlineVariant',
  'ink',
  'focus',
  'error',
  'onError',
  'success',
  'scrim',
  'accent1',
  'accent1Container',
  'onAccent1Container',
  'accent2',
  'accent2Container',
  'onAccent2Container',
  'accent3',
  'accent3Container',
  'onAccent3Container',
  'accent4',
  'accent4Container',
  'onAccent4Container',
] as const;

export type ColorRole = (typeof COLOR_ROLES)[number];
export type ColorSet = Readonly<Record<ColorRole, string>>;

/** Tokens other than colors. Values may use `var(--hb-color-*)`, never literal colors. */
export interface ThemeStyle {
  /** Titles: the hero, page and band titles, and big numbers. */
  displayWeight: string;
  /** Smaller headings in the display font, such as card titles. */
  headingWeight: string;
  /** Added to each title's own letter spacing. */
  displayTracking: string;
  /** Multiplies each title's own line height. */
  displayLeading: string;
  displayStyle: string;
  /** Multiplies the display sizes, with `theme.fonts.display.scale`. */
  displayScale: string;

  radiusS: string;
  radiusM: string;
  radiusL: string;
  /** Avatars: a squircle or a circle. */
  radiusAvatar: string;
  /** Buttons, chips, tabs, stickers and other small labels. */
  radiusControl: string;
  borderWidth: string;
  /** Border color of cards, buttons and chips. */
  borderColor: string;
  shadowCard: string;
  shadowCardHover: string;
  shadowButton: string;
  /** How far buttons and cards move when pressed, into their shadow. */
  pressOffset: string;
  /** The main call to action, such as "Get tickets". */
  ctaBackground: string;
  onCta: string;
  footerBackground: string;
  footerText: string;
  /** Behind everything, on `body`. */
  pageBackground: string;
  /** Behind a page's content, under its hero. */
  sectionBackground: string;
  /** How much of the page background the colored bands and heroes cover. */
  tintOpacity: string;
  /** Cards, menus, dialogs and the header. */
  panelBackground: string;
  /** Sticky bars, such as the schedule's tabs, track names and times. */
  barBackground: string;
  /** Applied to panels and bars, such as a blur for frosted glass. */
  backdropFilter: string;

  headerMaxWidth: string;
  /** Space around the header bar. */
  headerInset: string;
  headerRadius: string;
  headerBorder: string;
  headerShadow: string;
  /** The home hero's columns, its text and its illustration, on wide containers. */
  heroColumns: string;
  /** Moves the hero illustration before (-1) or after (0) the text. It is decorative. */
  heroArtOrder: string;
  /** A band's title and link: side by side (`row`) or stacked (`column`). */
  bandHeaderDirection: string;
  bandHeaderAlign: string;

  /** The easing of press and hover movement. */
  easePress: string;
  /** How much buttons and cards shrink when pressed. */
  pressScale: string;
  /** How far cards move on hover. */
  hoverTranslate: string;
  durationShort: string;
  durationMedium: string;
}

/** The background tones of bands and heroes. */
export const TONES = ['surface', 'accent-1', 'accent-2', 'accent-3', 'accent-4'] as const;
export type Tone = (typeof TONES)[number];

/** A tone's background and text color roles. */
export interface ToneColors {
  background: ColorRole;
  color: ColorRole;
}

/** Tones on the surface and the accent containers. */
export const containerTones: Readonly<Record<Tone, ToneColors>> = {
  surface: { background: 'surface', color: 'onSurface' },
  'accent-1': { background: 'accent1Container', color: 'onAccent1Container' },
  'accent-2': { background: 'accent2Container', color: 'onAccent2Container' },
  'accent-3': { background: 'accent3Container', color: 'onAccent3Container' },
  'accent-4': { background: 'accent4Container', color: 'onAccent4Container' },
};

/** A theme has a light and a dark color set. It cannot ship with only one. */
export interface Theme {
  light: ColorSet;
  dark: ColorSet;
  style: ThemeStyle;
  tones: Readonly<Record<Tone, ToneColors>>;
  fonts: ThemeFonts;
}

export const cssColorVar = (role: ColorRole) =>
  `--hb-color-${role.replace(/[A-Z0-9]/g, (char) => `-${char.toLowerCase()}`)}`;

export const cssStyleVar = (key: keyof ThemeStyle) =>
  `--hb-${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`;

export const cssToneVar = (tone: Tone, part: keyof ToneColors) => `--hb-tone-${tone}-${part}`;
