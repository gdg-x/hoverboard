import { css } from 'lit';

export const theme = css`
  :host {
    --dark-primary-color: #512da8;
    --default-primary-color: #673ab7;
    --focused-color: #311b92;
    --light-primary-color: #d1c4e9;
    --text-primary-color: #fff;
    --accent-color: #ff5252;
    --primary-background-color: #fff;
    --primary-text-color: #424242;
    --secondary-text-color: #757575;
    --disabled-text-color: #bdbdbd;
    --divider-color: #ededed;
    --footer-background-color: #f5f5f5;
    --footer-text-color: #616161;
    --twitter-color: #4099ff;
    --facebook-color: #3b5998;
    --border-light-color: #e2e2e2;
    --error-color: #e64a19;

    /* Custom */
    --default-background-color: #fff;
    --secondary-background-color: #f5f5f5;
    --additional-background-color: #f7f7f7;
    --contrast-additional-background-color: #e8e8e8;
    --animation: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    --slide-animation: 0.4s cubic-bezier(0, 0, 0.2, 1);
    --border-radius: 4px;
    --box-shadow: 0 2px 1px -1px rgb(0 0 0 / 20%), 0 1px 1px 0 rgb(0 0 0 / 14%),
      0 1px 3px 0 rgb(0 0 0 / 12%);
    --box-shadow-primary-color: 0 3px 3px -2px rgb(103 58 183 / 30%),
      0 3px 4px 0 rgb(103 58 183 / 30%), 0 1px 8px 0 rgb(103 58 183 / 30%);
    --box-shadow-primary-color-hover: 0 1px 3px -2px rgb(103 58 183 / 40%),
      0 4px 5px 0 rgb(103 58 183 / 40%), 0 2px 9px 0 rgb(103 58 183 / 40%);
    --font-family: -apple-system, blinkmacsystemfont, 'Segoe UI', roboto, helvetica, arial,
      sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
    --max-container-width: 1280px;
    --primary-color-transparent: rgb(103 58 183 / 10%);
    --primary-color-light: rgb(103 58 183 / 80%);
    --primary-color-white: #ede7f6;

    /* Labels */
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

  *,
  *::before,
  *::after {
    box-sizing: border-box;
    -moz-osx-font-smoothing: grayscale;
    -webkit-font-smoothing: antialiased;
  }

  body {
    font-family: var(--font-family);
    text-rendering: optimizelegibility;
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
    color: currentcolor;
    background: white;
    border: 1px solid currentcolor;
    border-radius: 32px;
    margin: 1px;
    line-height: initial;
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
