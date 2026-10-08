import { festival } from './festival';
import { spotlight } from './spotlight';
import {
  COLOR_ROLES,
  type RefreshTheme,
  type ThemeStyle,
  cssColorVar,
  cssStyleVar,
} from './tokens';

/** The refreshed built-in themes. Only the design gallery uses them until the refresh lands. */
export const REFRESH_THEMES = { festival, spotlight } as const satisfies Record<
  string,
  RefreshTheme
>;

export type RefreshThemeName = keyof typeof REFRESH_THEMES;

/**
 * The theme's tokens as CSS declarations. Each color is written once with `light-dark()`, so
 * `color-scheme` on the root picks the light or dark value.
 */
export const themeDeclarations = (theme: RefreshTheme): string =>
  [
    ...COLOR_ROLES.map(
      (role) => `${cssColorVar(role)}: light-dark(${theme.light[role]}, ${theme.dark[role]});`,
    ),
    ...(Object.keys(theme.style) as (keyof ThemeStyle)[]).map(
      (key) => `${cssStyleVar(key)}: ${theme.style[key]};`,
    ),
  ].join('\n');
