import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { scrollToElement } from '../../utils/scrolling';
import { Markdown } from './base';

// TODO: Add copy URL to clipboard buttons on headers

type Tree = {
  [id: string]: string[];
};

@customElement('toc-markdown')
export class TocMarkdown extends Markdown {
  static override get styles() {
    return [
      ...super.styles,
      css`
        img {
          width: 100%;
        }

        .content-wrapper {
          background-color: var(--secondary-background-color);
          width: 100%;
          overflow: hidden;
        }

        .col {
          font-size: 32px;
          line-height: 48px;
          margin-bottom: 24px;
          z-index: 2;
        }

        .col-content {
          line-height: 32px;
          display: block;
          font-size: 16px;
        }

        h2 {
          line-height: 2;
        }

        @media (min-width: 640px) {
          .content,
          .markdown-text,
          .markdown-wrapper {
            padding: 0 18px;
          }

          .col {
            margin-right: 24px;
          }

          .col:last-of-type {
            margin-right: 0;
          }

          h2 {
            font-size: 40px;
            width: 40%;
            margin-bottom: 0;
            display: inline-block;
            transform: translateY(85%);
            vertical-align: bottom;
            line-height: 1;
          }

          h3 {
            line-height: 1.5;
          }

          h3,
          h4,
          p,
          ol,
          ul {
            margin-left: 40%;
          }

          h3::after {
            display: none;
          }

          h3:hover::after {
            display: inline-block;
          }
        }

        @media (min-width: 812px) {
          .content,
          .markdown-text,
          .markdown-wrapper {
            padding: 0 40px;
          }
        }
      `,
    ];
  }

  override render() {
    return html`
      ${this.renderToc}

      <div class="container">
        <div class="markdown-wrapper">${this.document}</div>
      </div>
    `;
  }

  private renderSubheader(headerId: string) {
    const header = this.headers.find((header) => header.id === headerId);
    return html`
      <a
        class="col-content"
        href="${window.location.pathname}#${headerId}"
        @click="${() => this.scrollToId(headerId)}"
        router-ignore
        >${header?.textContent ?? headerId}</a
      >
    `;
  }

  private renderHeader(headerId: string, subheaderIds: string[]) {
    const header = this.headers.find((header) => header.id === headerId);
    return html`
      <div class="col">
        ${header?.textContent ?? headerId}
        ${subheaderIds.map((subheaderId) => this.renderSubheader(subheaderId))}
      </div>
    `;
  }

  private get renderToc() {
    return html`
      <div class="content-wrapper">
        <div class="container">
          <div class="content" layout justified horizontal wrap>
            ${Object.keys(this.headerIds).map((headerId) =>
              this.renderHeader(headerId, this.headerIds[headerId]!)
            )}
          </div>
        </div>
      </div>
    `;
  }

  override connectedCallback() {
    super.connectedCallback();
    const [, id] = window.location.hash.split('#');
    if (id) {
      this.updateComplete.then(() => this.scrollToId(id));
    }
  }

  private get headers() {
    return Array.from(this.document.querySelectorAll('h2, h3'));
  }

  private get headerIds(): Tree {
    const tree: Tree = {};
    let parent: string | undefined = undefined;

    for (const header of this.headers) {
      // We care about h2 and h3 tags
      if (header.tagName === 'H2') {
        parent = header.id;
        tree[parent] = [];
      } else if (header.tagName === 'H3') {
        if (!parent || tree[parent] === undefined) {
          throw new Error('Markedown file h2 headers must be after an h3 header');
        }
        tree[parent]!.push(header.id);
      }
    }

    return tree;
  }

  private scrollToId(id: string) {
    const element = this.shadowRoot!.getElementById(id);
    if (element) {
      scrollToElement(element);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'toc-markdown': TocMarkdown;
  }
}
