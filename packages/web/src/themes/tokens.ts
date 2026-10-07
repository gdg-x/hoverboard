/** Color tokens, by the name `site.json` uses in `theme.colors`, mapped to the CSS variable. */
export const THEME_TOKENS = {
  primary: '--default-primary-color',
  primaryDark: '--dark-primary-color',
  focused: '--focused-color',
  accent: '--accent-color',
  onPrimary: '--text-primary-color',
  background: '--primary-background-color',
  defaultBackground: '--default-background-color',
  secondaryBackground: '--secondary-background-color',
  additionalBackground: '--additional-background-color',
  contrastAdditionalBackground: '--contrast-additional-background-color',
  text: '--primary-text-color',
  secondaryText: '--secondary-text-color',
  disabledText: '--disabled-text-color',
  divider: '--divider-color',
  borderLight: '--border-light-color',
  footerBackground: '--footer-background-color',
  footerText: '--footer-text-color',
  error: '--error-color',
  snackbarBackground: '--snackbar-background-color',
  snackbarText: '--snackbar-text-color',
  starRating: '--star-rating-color',
  twitter: '--twitter-color',
  facebook: '--facebook-color',
} as const;

export type ThemeToken = keyof typeof THEME_TOKENS;
export type Theme = Readonly<Record<ThemeToken, string>>;
