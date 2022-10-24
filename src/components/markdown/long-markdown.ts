import { css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Markdown } from './base';

@customElement('long-markdown')
export class LongMarkdown extends Markdown {
  static override get styles() {
    return [
      ...super.styles,
      css`
        .markdown-html {
          font-size: 18px;
          line-height: 1.8;
          color: var(--primary-text-color);
        }

        .markdown-html h1,
        .markdown-html h2,
        .markdown-html h3 {
          margin: 48px 0 16px;
        }

        .markdown-html p {
          margin-top: 0;
          margin-bottom: 24px;
        }

        .markdown-html img {
          width: 100%;
        }

        .markdown-html img {
          margin: 32px 0 8px -16px;
          width: calc(100% + 32px);
          min-height: 200px;
          background-color: var(--secondary-background-color);
        }

        @media (min-width: 640px) {
          .markdown-html img {
            min-height: 400px;
          }
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'long-markdown': LongMarkdown;
  }
}
