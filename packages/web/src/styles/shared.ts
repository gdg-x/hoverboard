import { css } from 'lit';

/**
 * Stops animations and transitions with reduced motion. The document's own rule in `base.css` does
 * not reach into shadow roots, so every component includes this.
 */
export const reducedMotion = css`
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

/** Styles every `hb-*` primitive starts with. */
export const primitive = css`
  ${reducedMotion}

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
