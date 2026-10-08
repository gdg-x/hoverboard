import { css } from 'lit';

/** Styles every `hb-*` primitive starts with. */
export const primitive = css`
  :host([hidden]) {
    display: none !important;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  :focus-visible {
    outline: 3px solid var(--hb-color-focus);
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    :focus-visible {
      outline-color: Highlight;
    }
  }
`;

/** Hover and pressed state layers: the content color mixed over the background. */
export const stateLayer = css`
  .state:hover {
    background-image: linear-gradient(color-mix(in srgb, currentColor 8%, transparent) 0 0);
  }

  .state:active {
    background-image: linear-gradient(color-mix(in srgb, currentColor 12%, transparent) 0 0);
  }

  .state:disabled,
  .state[aria-disabled='true'] {
    background-image: none;
  }
`;
