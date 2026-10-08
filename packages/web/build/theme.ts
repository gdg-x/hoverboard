import { deriveDarkColor } from '../src/themes/color';
import { contrastFailures } from '../src/themes/contrast';
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

/**
 * The theme as CSS on `:root`, so the first paint is themed: every color with `light-dark()`, the
 * other tokens, the density, the pre-refresh variables, and the tag and badge colors.
 */
export const themeCss = (theme: ResolvedTheme, named: Record<string, string> = {}): string => {
  const scheme = theme.colorScheme === 'system' ? 'light dark' : theme.colorScheme;
  // Browsers without light-dark() get the scheme the site uses, or light.
  const fallback = theme.colorScheme === 'dark' ? theme.dark : theme.light;
  const declarations = [
    `color-scheme: ${scheme};`,
    `--hb-density: ${DENSITY_FACTORS[theme.density]};`,
    themeDeclarations(theme),
    ...Object.entries(LEGACY_VARIABLES).map(([property, value]) => `${property}: ${value};`),
    ...Object.entries(named).map(([name, color]) => `--${name}: ${color};`),
  ];
  const fallbackDeclarations = COLOR_ROLES.map(
    (role) => `${cssColorVar(role)}: ${fallback[role]};`,
  );
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
