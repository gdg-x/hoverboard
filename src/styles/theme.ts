import { css } from 'lit-element';

export const theme = css`
  :host {
    --dark-primary-color: #c9424b;
    --default-primary-color: #fb4552;
    --focused-color: #ff5762;
    --light-primary-color: #ff5762;
    --text-primary-color: #FFFFFF;
    --accent-color: #FF9800;
    --primary-background-color: #FFFFFF;
    --primary-text-color: #212121;
    --secondary-text-color: #757575;
    --disabled-text-color: #BDBDBD;
    --divider-color: #BDBDBD;
    --footer-background-color: #fb4552;
    --footer-text-color: #FFFFFF;
    --twitter-color: #4099FF;
    --facebook-color: #3B5998;
    --border-light-color: #E2E2E2;
    --error-color: #e64a19;
    --tertiary-background-color:  rgb(247, 247, 247);

    /* Custom */
    --default-background-color: #ffffff;
    --secondary-background-color: #f5f5f5;
    --additional-background-color: #f7f7f7;
    --contrast-additional-background-color: #e8e8e8;
    --animation: 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    --slideAnimation: 0.4s cubic-bezier(0, 0, 0.2, 1);
    --border-radius: 4px;
    --box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14),
      0px 1px 3px 0px rgba(0, 0, 0, 0.12);
    --box-shadow-primary-color: 0 3px 3px -2px rgba(103, 58, 183, 0.3),
      0 3px 4px 0 rgba(103, 58, 183, 0.3), 0 1px 8px 0 rgba(103, 58, 183, 0.3);
    --box-shadow-primary-color-hover: 0 1px 3px -2px rgba(103, 58, 183, 0.4),
      0 4px 5px 0 rgba(103, 58, 183, 0.4), 0 2px 9px 0 rgba(103, 58, 183, 0.4);
    --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial,
      sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
    --max-container-width: 1280px;

    --primary-color-transparent: rgba(251, 69, 82, 0.1);
    --primary-color-light: rgba(251, 69, 82, 0.8);
    --primary-color-white: #ede7f6;

    /* Labels */
    --gde: #3d5afe;
    --wtm: #1de9b6;
    --gdg: #00b0ff;

    /* Tags */
    --langage-framework: #f4724e;
    --random: #5b85aa;
    --design: #83b692;
    --architecture-paradigme: #654f6f;
    --data-machine-learning: #ef5e68;
    --devops-cloud: #ffc152;
    --general: #bdbdbd;
    --android: #78c257;
    --web: #2196f3;
    --cloud: #3f51b5;
    --community: #e91e63;
    --it: #9E9E9E;
    --angular-js: #e0343d;
    --angular-js2: #e0343d;
    --protractor: #e0343d;
    --polymer: #d81b60;
    --dart: #00b4aa;
    --firebase: #ff9800;
    --appengine: #0d47a1;
    --serviceworkers: #311b92;
    --web-rtc: #7b1fa2;
    --kubernetes: #326de6;
    --data-sync: #006064;
    --gae: #ffc107;
    --ndk: #4caf50;
    --ble: #1565c0;
    --ci: #cddc39;
    --tv: #d32f2f;
    --grpc: #607d8b;
    --ux: #9c27b0;
    --material-design: #009688;
    --entrepreneurship: #673ab7;
    --design-patterns: #673ab7;
    --libraries: #ffc107;
    --realm: #ff9800;
    --animations: #311b92;
    --go: #009688;
    --open-stack: #e0343d;
    --docker: #2196f3;
    --chrome-extensions: #ff9800;
    --progressive-web-apps: #00b4aa;
  }

  *,
  *:before,
  *:after {
    box-sizing: border-box;
    -moz-osx-font-smoothing: grayscale;
    -webkit-font-smoothing: antialiased;
  }

  body {
    font-family: var(--font-family);
    text-rendering: optimizeLegibility;
    color: var(--primary-text-color);
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 0;
    font-weight: normal;
  }

  h1 {
    padding: 8px 8px 24px 14px;
    font-size: 24px;
    line-height: 30px;
    font-weight: 500;
  }

  a {
    color: var(--default-primary-color);
    text-decoration: none;
    transition: border-color var(--animation);
  }

  mwc-button {
    --mdc-theme-primary: var(--default-primary-color);
    --mdc-theme-on-primary: var(--default-background-color);
  }

  paper-button {
    padding: 0.7em;
    border-radius: 2px;
    font-size: 14px;
    color: var(--default-primary-color);
    transition: background-color var(--animation);
  }

  paper-button:hover {
    background-color: var(--primary-color-transparent);
  }

  paper-button[disabled] {
    cursor: default;
    background-color: var(--primary-color-transparent);
    opacity: 0.8;
  }

  paper-button[primary] {
    background-color: var(--default-primary-color);
    color: var(--text-primary-color);
  }

  paper-button[primary]:hover {
    background-color: var(--primary-color-light);
  }

  paper-button[primary][invert] {
    color: var(--default-primary-color);
    background-color: var(--text-primary-color);
  }

  paper-button[primary][invert]:hover {
    background-color: var(--primary-color-white);
  }

  paper-button[primary-text] {
    color: var(--default-primary-color);
  }

  paper-button iron-icon {
    --iron-icon-height: 20px;
    --iron-icon-width: 20px;
  }

  paper-button.icon-right iron-icon {
    margin-left: 8px;
  }

  paper-button.icon-left iron-icon {
    margin-right: 8px;
  }

  paper-button.animated iron-icon {
    transition: transform var(--animation);
  }

  paper-button.animated.icon-right:hover iron-icon {
    transform: translateX(4px);
  }

  paper-button.animated.icon-left:hover iron-icon {
    transform: translateX(-4px);
  }

  .container,
  .container-narrow {
    margin: 0 auto;
    padding: 24px 16px;
    max-width: var(--max-container-width);
  }

  .container-narrow {
    max-width: 800px;
  }

  .container-title {
    margin-bottom: 24px;
    padding: 0;
    font-size: 32px;
    line-height: 30px;
  }

  .big-icon {
    --iron-icon-height: 48px;
    --iron-icon-width: 48px;
  }

  .gde-b {
    background-color: var(--gde);
  }

  .wtm-b {
    background-color: var(--wtm);
  }

  .gdg-b {
    background-color: var(--gdg);
  }

  .google-b {
    background-color: var(--secondary-background-color);
  }

  .google-b .badge-icon {
    --iron-icon-width: 18px;
    --iron-icon-height: 18px;
    color: #fff;
  }

  .card {
    background-color: var(--default-background-color);
    box-shadow: var(--box-shadow);
    border-radius: var(--border-radius);
    transition: box-shadow var(--animation);
    cursor: pointer;
  }

  .tag {
    height: 32px;
    padding: 8px 12px;
    font-size: 12px;
    color: currentColor;
    background: white;
    border: 1px solid currentColor;
    border-radius: 32px;
  }

  @media (min-width: 640px) {
    .container,
    .container-narrow {
      padding: 32px;
    }

    .card:hover {
      box-shadow: var(--box-shadow);
    }
  }
`;
