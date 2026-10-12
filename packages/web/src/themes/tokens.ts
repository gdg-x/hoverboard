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
  /** The home hero title's `font-style`, such as italic. */
  heroTitleStyle: string;
  /** Multiplies the size of text in the `accent` font, for handwriting that runs small. */
  accentScale: string;
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
  /** The bar's border widths, such as `0 0 1px` for only a line under it. */
  headerBorderWidth: string;
  headerShadow: string;
  /** `flex` for the logo and the actions. `1 1 0` gives them equal room, so the navigation sits in the middle. */
  headerSideFlex: string;
  /** The home hero's columns, its text and its illustration, on wide containers. */
  heroColumns: string;
  /** `start` or `center`, for the home hero's text. */
  heroAlign: string;
  /** The home hero's text on a panel: its background, padding and shadow. `transparent`, 0 and `none` for none. */
  heroPanelBackground: string;
  heroPanelPadding: string;
  heroPanelShadow: string;
  /** Moves the hero illustration before (-1) or after (0) the text. It is decorative. */
  heroArtOrder: string;
  /** `block`, or `none` to leave the illustration out on wide containers too. */
  heroArtDisplay: string;
  /** The illustration's widest, such as when it sits under the text. */
  heroArtMaxWidth: string;
  /** A band's title and link: side by side (`row`) or stacked (`column`). */
  bandHeaderDirection: string;
  bandHeaderAlign: string;
  /** `start` or `center`, for a band's title, lede and eyebrow. */
  bandTextAlign: string;
  /** `block` shows each band's number above its title, `none` hides it. */
  bandEyebrow: string;
  eyebrowColor: string;
  /** Multiplies the smallest width of speaker cards in a grid, so larger means fewer per row. */
  cardScale: string;
  /** How far every other speaker card on the home page sits lower, like a scrapbook. */
  cardStagger: string;
  /** Space around each band, as a `margin`, so bands can be panels instead of full-bleed. */
  bandInset: string;
  bandRadius: string;
  /** A border between bands. */
  bandDivider: string;
  /** Under a band title, as a `text-decoration`. */
  titleUnderline: string;

  /** The decorations, which `decorations: false` and forced colors turn off. Drawn in `currentColor`. */
  heroPattern: string;
  /** A `mask` for a band's top and bottom edges, such as a zigzag. */
  bandEdge: string;
  /** Layered over `pageBackground`. */
  pageTexture: string;
  /** A `clip-path` for stickers. */
  stickerShape: string;
  /** Multiplies each sticker's tilt. */
  stickerTiltScale: string;
  /** Padding around photos, such as a polaroid frame, in `photoFrameColor`. */
  photoFrame: string;
  photoFrameColor: string;
  /** Photos in a gallery turn by this much, one way then the other. */
  photoTilt: string;
  /** A `background` for a strip of tape on gallery photos, or `none`. */
  photoTape: string;
  /** A `filter` for people's photos, such as grayscale. */
  avatarFilter: string;
  /** The filter on a hovered or focused card. */
  avatarFilterHover: string;
  /** A `box-shadow` for people's photos on cards and pages. */
  avatarShadow: string;

  /** The easing of press and hover movement. */
  easePress: string;
  /** How much buttons and cards shrink when pressed. */
  pressScale: string;
  /** How far cards move on hover. */
  hoverTranslate: string;
  /** How far cards turn on hover. */
  hoverRotate: string;
  durationShort: string;
  durationMedium: string;
}

/** The background tones of bands and heroes. */
export const TONES = ['surface', 'accent-1', 'accent-2', 'accent-3', 'accent-4'] as const;
export type Tone = (typeof TONES)[number];

/** A tone's background and text color roles, and the pattern on its bands. */
export interface ToneColors {
  background: ColorRole;
  color: ColorRole;
  /** `background` layers, drawn in `currentColor`. A decoration, like `heroPattern`. */
  pattern?: string;
}

/** Tones on the surface and the accent containers. */
export const containerTones: Readonly<Record<Tone, ToneColors>> = {
  surface: { background: 'surface', color: 'onSurface' },
  'accent-1': { background: 'accent1Container', color: 'onAccent1Container' },
  'accent-2': { background: 'accent2Container', color: 'onAccent2Container' },
  'accent-3': { background: 'accent3Container', color: 'onAccent3Container' },
  'accent-4': { background: 'accent4Container', color: 'onAccent4Container' },
};

/** A grid of small dots in the text color, as a `background` layer. */
export const dots =
  'radial-gradient(color-mix(in srgb, currentColor 14%, transparent) 1.5px, transparent 1.6px) 0 0 / 22px 22px';

/** Diagonal lines in the text color. */
export const stripes =
  'repeating-linear-gradient(-45deg, color-mix(in srgb, currentColor 10%, transparent) 0 2px, transparent 2px 14px)';

/** Graph paper lines in the text color. */
export const grid = [0, 90]
  .map(
    (angle) =>
      `linear-gradient(${angle}deg, color-mix(in srgb, currentColor 10%, transparent) 1px, transparent 1px) 0 0 / 28px 28px`,
  )
  .join(', ');

export type ColorScheme = 'system' | 'light' | 'dark';

/** A theme has a light and a dark color set. It cannot ship with only one. */
export interface Theme {
  light: ColorSet;
  dark: ColorSet;
  /** The scheme for sites that do not set `theme.colorScheme`. */
  colorScheme: ColorScheme;
  style: ThemeStyle;
  tones: Readonly<Record<Tone, ToneColors>>;
  fonts: ThemeFonts;
}

export const cssColorVar = (role: ColorRole) =>
  `--hb-color-${role.replace(/[A-Z0-9]/g, (char) => `-${char.toLowerCase()}`)}`;

export const cssStyleVar = (key: keyof ThemeStyle) =>
  `--hb-${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`;

export const cssToneVar = (tone: Tone, part: keyof ToneColors) => `--hb-tone-${tone}-${part}`;
