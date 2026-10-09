import type { BuiltInFontName, FontRole } from './fonts';

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
  radiusS: string;
  radiusM: string;
  radiusL: string;
  /** Avatars: a squircle or a circle. */
  radiusAvatar: string;
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
}

/** A theme has a light and a dark color set. It cannot ship with only one. */
export interface Theme {
  light: ColorSet;
  dark: ColorSet;
  style: ThemeStyle;
  fonts: Readonly<Record<FontRole, BuiltInFontName>>;
}

export const cssColorVar = (role: ColorRole) =>
  `--hb-color-${role.replace(/[A-Z0-9]/g, (char) => `-${char.toLowerCase()}`)}`;

export const cssStyleVar = (key: keyof ThemeStyle) =>
  `--hb-${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`;
