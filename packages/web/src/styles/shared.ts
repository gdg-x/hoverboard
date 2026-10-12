import { type CSSResult, css, unsafeCSS } from 'lit';

type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';

/**
 * Text in the display font, with the theme's weight, style, tracking, line height and scale over
 * the given ones. `display` is for titles and big numbers, `heading` for smaller headings. A size is
 * a step of the type scale or any length. Follow it with `;`, as with a declaration.
 */
export const displayFont = (
  weight: 'display' | 'heading',
  size: TextSize | CSSResult,
  leading: number,
  tracking = 0,
) => {
  const length = typeof size === 'string' ? `var(--hb-text-${size})` : size.cssText;
  const fallbackWeight = weight === 'display' ? 800 : 700;
  // A string, not css``: lit-analyzer and Prettier expect a rule, and this is only declarations.
  return unsafeCSS(
    [
      `font: var(--hb-${weight}-weight, ${fallbackWeight}) calc(${length} * var(--hb-display-scale, 1) * var(--hb-font-display-scale, 1)) / calc(${leading} * var(--hb-display-leading, 1)) var(--hb-font-display);`,
      'font-style: var(--hb-display-style, normal);',
      `letter-spacing: calc(${tracking}em + var(--hb-display-tracking, 0em))`,
    ].join('\n'),
  );
};

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
