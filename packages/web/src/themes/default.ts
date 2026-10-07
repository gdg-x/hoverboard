import type { Theme } from './tokens';

// The default theme. Shared styles derive lighter and transparent primary colors from these.
export const defaultTheme: Theme = {
  primary: '#673ab7',
  primaryDark: '#512da8',
  focused: '#311b92',
  accent: '#ff5252',
  onPrimary: '#fff',
  background: '#fff',
  defaultBackground: '#fff',
  secondaryBackground: '#f5f5f5',
  additionalBackground: '#f7f7f7',
  contrastAdditionalBackground: '#e8e8e8',
  text: '#424242',
  secondaryText: '#757575',
  disabledText: '#bdbdbd',
  divider: '#ededed',
  borderLight: '#e2e2e2',
  footerBackground: '#f5f5f5',
  footerText: '#616161',
  error: '#e64a19',
  snackbarBackground: '#323232',
  snackbarText: 'rgb(255 255 255 / 87%)',
  starRating: '#faca43',
  twitter: '#4099ff',
  facebook: '#3b5998',
};
