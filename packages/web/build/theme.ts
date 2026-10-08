import { deriveDarkColor, tagContainerColors } from '../src/themes/color';
import { contrastFailures, contrastRatio } from '../src/themes/contrast';
import { THEMES, type ThemeName, themeDeclarations } from '../src/themes/index';
import { LEGACY_VARIABLES } from '../src/themes/legacy';
import {
  COLOR_ROLES,
  type ColorRole,
  type ColorSet,
  type Theme,
  cssColorVar,
} from '../src/themes/tokens';
import type { SiteFonts } from './fonts';

export type ColorScheme = 'system' | 'light' | 'dark';
export type Density = 'compact' | 'default' | 'roomy';

export const DENSITY_FACTORS: Readonly<Record<Density, number>> = {
  compact: 0.75,
  default: 1,
  roomy: 1.25,
};

/** `theme` in site.json, with the defaults merged in. */
export interface SiteTheme {
  name: ThemeName;
  colorScheme: ColorScheme;
  density: Density;
  decorations: boolean;
  colors?: Partial<ColorSet>;
  darkColors?: Partial<ColorSet>;
  fonts?: SiteFonts;
  tagColors?: Record<string, string>;
  badgeColors?: Record<string, string>;
}

export interface ResolvedTheme extends Theme {
  name: ThemeName;
  colorScheme: ColorScheme;
  density: Density;
  decorations: boolean;
}

const isHex = (color: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color);

/**
 * The built-in theme that `theme.name` picks, with the site's colors over it. A light color without
 * a dark one gets a dark version with the same hue.
 */
export const resolveTheme = (site: SiteTheme): ResolvedTheme => {
  const base = THEMES[site.name] ?? THEMES.festival;
  const colors = site.colors ?? {};
  const derived = Object.fromEntries(
    (Object.entries(colors) as [ColorRole, string][])
      .filter(([role, color]) => !site.darkColors?.[role] && isHex(color) && isHex(base.dark[role]))
      .map(([role, color]) => [role, deriveDarkColor(color, base.dark[role])]),
  );
  return {
    ...base,
    light: { ...base.light, ...colors },
    dark: { ...base.dark, ...derived, ...site.darkColors },
    name: site.name,
    colorScheme: site.colorScheme,
    density: site.density,
    decorations: site.decorations,
  };
};

export const usedSchemes = (colorScheme: ColorScheme): ('light' | 'dark')[] =>
  colorScheme === 'system' ? ['light', 'dark'] : [colorScheme];

/** Color pairs below the WCAG AA contrast they need, in the schemes the site uses. */
export const themeErrors = (theme: ResolvedTheme): string[] =>
  contrastFailures(theme, usedSchemes(theme.colorScheme)).map(
    ({ scheme, foreground, background, ratio, min }) =>
      `site.json/theme: ${foreground} on ${background} has a contrast of ${ratio.toFixed(2)}:1 in the ${scheme} scheme, and needs ${min}:1. Change theme.${scheme === 'dark' ? 'darkColors' : 'colors'}.`,
  );

// `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb(r g b / a%)` and `rgba(r, g, b, a)`.
const parseColor = (color: string): [number, number, number, number] | undefined => {
  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(color)?.[1];
  if (hex) {
    const digits = hex.length <= 4 ? [...hex].map((digit) => digit + digit).join('') : hex;
    const [r = 0, g = 0, b = 0, a = 255] = [0, 2, 4, 6]
      .filter((start) => start < digits.length)
      .map((start) => parseInt(digits.slice(start, start + 2), 16));
    return [r, g, b, a / 255];
  }
  const rgb =
    /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[,/]\s*([\d.]+)(%?))?\s*\)$/i.exec(color);
  if (!rgb) return undefined;
  const alpha = rgb[4] === undefined ? 1 : Number(rgb[4]) / (rgb[5] ? 100 : 1);
  return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), alpha];
};

const toHex = (channels: number[]) =>
  `#${channels.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;

/**
 * The home hero over a photo uses the dark scheme, so its text is the dark `onSurface` on the dark
 * `scrim`. The check puts the scrim over a white photo, the worst case.
 */
export const heroPhotoErrors = (theme: ResolvedTheme): string[] => {
  const scrim = parseColor(theme.dark.scrim);
  const text = theme.dark.onSurface;
  if (!scrim || !isHex(text)) return [];
  const [r, g, b, alpha] = scrim;
  const background = toHex([r, g, b].map((channel) => channel * alpha + 255 * (1 - alpha)));
  const ratio = contrastRatio(text, background);
  return ratio < 4.5
    ? [
        `site.json/heroSettings/home/background: onSurface on the scrim over a white photo has a contrast of ${ratio.toFixed(2)}:1 in the dark scheme, and needs 4.5:1. Make theme.darkColors.scrim darker.`,
      ]
    : [];
};

/**
 * A tag or badge color as `--<name>` (the pre-refresh name) and `--hb-tag-<name>`, with a container
 * and a text color for chips in each scheme.
 */
const tagDeclarations = (name: string, color: string, fallbackScheme: 'light' | 'dark') => {
  const plain = [`--${name}: ${color};`, `--hb-tag-${name}: ${color};`];
  if (!isHex(color)) return { declarations: plain, fallback: [] };
  const { light, dark } = tagContainerColors(color);
  const fallback = fallbackScheme === 'dark' ? dark : light;
  return {
    declarations: [
      ...plain,
      `--hb-tag-${name}-container: light-dark(${light.container}, ${dark.container});`,
      `--hb-on-tag-${name}-container: light-dark(${light.onContainer}, ${dark.onContainer});`,
    ],
    fallback: [
      `--hb-tag-${name}-container: ${fallback.container};`,
      `--hb-on-tag-${name}-container: ${fallback.onContainer};`,
    ],
  };
};

/**
 * The theme as CSS on `:root`, so the first paint is themed: every color with `light-dark()`, the
 * other tokens, the density, the pre-refresh variables, and the tag and badge colors.
 */
export const themeCss = (theme: ResolvedTheme, named: Record<string, string> = {}): string => {
  const scheme = theme.colorScheme === 'system' ? 'light dark' : theme.colorScheme;
  // Browsers without light-dark() get the scheme the site uses, or light.
  const fallbackScheme = theme.colorScheme === 'dark' ? 'dark' : 'light';
  const fallback = theme[fallbackScheme];
  const tags = Object.entries(named).map(([name, color]) =>
    tagDeclarations(name, color, fallbackScheme),
  );
  const declarations = [
    `color-scheme: ${scheme};`,
    `--hb-density: ${DENSITY_FACTORS[theme.density]};`,
    themeDeclarations(theme),
    ...Object.entries(LEGACY_VARIABLES).map(([property, value]) => `${property}: ${value};`),
    ...tags.flatMap((tag) => tag.declarations),
  ];
  const fallbackDeclarations = [
    ...COLOR_ROLES.map((role) => `${cssColorVar(role)}: ${fallback[role]};`),
    ...tags.flatMap((tag) => tag.fallback),
  ];
  return [
    `:root {\n${declarations.join('\n')}\n}`,
    `@supports not (color: light-dark(#000, #fff)) {\n:root {\n${fallbackDeclarations.join('\n')}\n}\n}`,
  ].join('\n');
};

/**
 * The header logo in the dark scheme, which `base.css` switches to: `/images/logo-dark.svg`, or the
 * event's short name as text when the site has no dark logo.
 */
export const darkLogoCss = (hasDarkLogo: boolean): string =>
  hasDarkLogo
    ? ':root {\n--hb-logo-dark-image: url("/images/logo-dark.svg");\n--hb-logo-dark-display: block;\n--hb-logo-dark-name-display: none;\n}'
    : ':root {\n--hb-logo-dark-image: none;\n--hb-logo-dark-display: none;\n--hb-logo-dark-name-display: inline;\n}';
