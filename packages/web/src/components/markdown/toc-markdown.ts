import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { type MarkdownHeading, renderMarkdownWithHeadings } from '../../utils/markdown';
import { scrollToElement } from '../../utils/scrolling';
import { Markdown } from './base';

interface Section {
  header: MarkdownHeading;
  subheaders: MarkdownHeading[];
}

// Each h2 starts a section, and the h3s after it are its subheaders.
const sections = (headings: MarkdownHeading[]): Section[] => {
  const result: Section[] = [];
  for (const heading of headings) {
    if (heading.level === 2) {
      result.push({ header: heading, subheaders: [] });
    } else if (heading.level === 3) {
      const section = result.at(-1);
      if (!section) {
        throw new Error('Markdown files must have an h2 header before any h3 header');
      }
      section.subheaders.push(heading);
    }
  }
  return result;
};

@customElement('toc-markdown')
export class TocMarkdown extends Markdown {
  static override styles = css`
    img {
      width: 100%;
    }

    .content-wrapper {
      background-color: var(--secondary-background-color);
      width: 100%;
      overflow: hidden;
    }

    .content {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
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
  `;

  /** The page's path, for the table of contents links. The page has a `<base>`, so `#id` alone would leave it. */
  @property({ attribute: 'page-path' })
  accessor pagePath = '';

  override render() {
    const { html: body, headings } = renderMarkdownWithHeadings(this.content);
    return html`
      ${this.renderToc(headings)}

      <div class="container">
        <div class="markdown-wrapper">${unsafeHTML(body)}</div>
      </div>
    `;
  }

  private renderSubheader({ id, text }: MarkdownHeading) {
    return html`
      <a
        class="col-content"
        href="${this.pagePath}#${id}"
        @click="${() => this.scrollToId(id)}"
        rel="external"
        >${text}</a
      >
    `;
  }

  private renderToc(headings: MarkdownHeading[]) {
    return html`
      <div class="content-wrapper">
        <div class="container">
          <div class="content">
            ${sections(headings).map(
              ({ header, subheaders }) => html`
                <div class="col">
                  ${header.text} ${subheaders.map((subheader) => this.renderSubheader(subheader))}
                </div>
              `,
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
