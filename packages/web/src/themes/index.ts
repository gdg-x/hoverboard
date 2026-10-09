import { festival } from './festival';
import { paper } from './paper';
import { spotlight } from './spotlight';
import { COLOR_ROLES, type Theme, type ThemeStyle, cssColorVar, cssStyleVar } from './tokens';

/** The built-in themes. `theme.name` in site.json picks one. */
export const THEMES = { festival, spotlight, paper } as const satisfies Record<string, Theme>;

export type ThemeName = keyof typeof THEMES;

/**
 * The theme's tokens as CSS declarations. Each color is written once with `light-dark()`, so
 * `color-scheme` on the root picks the light or dark value.
 */
export const themeDeclarations = (theme: Pick<Theme, 'light' | 'dark' | 'style'>): string =>
  [
    ...COLOR_ROLES.map(
      (role) => `${cssColorVar(role)}: light-dark(${theme.light[role]}, ${theme.dark[role]});`,
    ),
    ...(Object.keys(theme.style) as (keyof ThemeStyle)[]).map(
      (key) => `${cssStyleVar(key)}: ${theme.style[key]};`,
    ),
  ].join('\n');
