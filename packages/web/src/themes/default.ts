import { css } from 'lit';

// The default theme: color tokens only. Shared styles derive the other colors from these.
export const defaultTheme = css`
  :host {
    --default-primary-color: #673ab7;
    --dark-primary-color: #512da8;
    --focused-color: #311b92;
    --accent-color: #ff5252;
    --text-primary-color: #fff;
    --primary-background-color: #fff;
    --default-background-color: #fff;
    --secondary-background-color: #f5f5f5;
    --additional-background-color: #f7f7f7;
    --contrast-additional-background-color: #e8e8e8;
    --primary-text-color: #424242;
    --secondary-text-color: #757575;
    --disabled-text-color: #bdbdbd;
    --divider-color: #ededed;
    --border-light-color: #e2e2e2;
    --footer-background-color: #f5f5f5;
    --footer-text-color: #616161;
    --error-color: #e64a19;
    --snackbar-background-color: #323232;
    --snackbar-text-color: rgb(255 255 255 / 87%);
    --star-rating-color: #faca43;
    --twitter-color: #4099ff;
    --facebook-color: #3b5998;

    /* Badges */
    --gde: #3d5afe;
    --wtm: #1de9b6;
    --gdg: #00b0ff;

    /* Tags */
    --general: #9e9e9e;
    --android: #78c257;
    --web: #2196f3;
    --cloud: #3f51b5;
    --community: #e91e63;
    --design: #e91e63;
  }
`;
