import { css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Markdown } from './base';

@customElement('short-markdown')
export class ShortMarkdown extends Markdown {
  static override styles = css`
    img {
      width: 100%;
    }

    /* Links in running text need more than their color (WCAG 1.4.1). */
    a {
      text-decoration: underline;
      text-underline-offset: 0.2em;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'short-markdown': ShortMarkdown;
  }
}
