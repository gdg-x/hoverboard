import { css, html, type TemplateResult } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

/**
 * An illustration from this folder, imported with `?raw` so it can read the theme's CSS
 * variables. It is decorative: the text next to it says what it shows.
 */
export const illustration = (svg: string, className = ''): TemplateResult =>
  html`<div class="illustration ${className}" aria-hidden="true">${unsafeHTML(svg)}</div>`;

export const illustrationStyles = css`
  .illustration svg {
    display: block;
    inline-size: 100%;
    block-size: auto;
  }
`;
