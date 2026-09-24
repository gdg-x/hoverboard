import { css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Markdown } from './base';

@customElement('short-markdown')
export class ShortMarkdown extends Markdown {
  static override get styles() {
    return [
      ...super.styles,
      css`
        img {
          width: 100%;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'short-markdown': ShortMarkdown;
  }
}
