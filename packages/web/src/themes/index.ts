import { defaultTheme } from './default';
import type { Theme } from './tokens';

/** The built-in themes. `theme.name` in site.json picks one. */
export const THEMES = {
  default: defaultTheme,
} as const satisfies Record<string, Theme>;

export type ThemeName = keyof typeof THEMES;
