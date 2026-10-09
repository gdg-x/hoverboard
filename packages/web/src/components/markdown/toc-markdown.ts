import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import {
  type MarkdownHeading,
  renderMarkdownWithHeadings,
  withDisclosures,
} from '../../utils/markdown';
import { scrollToElement } from '../../utils/scrolling';
import { prose } from '../../styles/prose';
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

/**
 * A markdown page with its table of contents, which sticks beside the text on wide containers.
 * With `disclosures`, each `###` question opens and closes, as in the FAQ.
 */
@customElement('toc-markdown')
export class TocMarkdown extends Markdown {
  static override styles = [
    prose,
    css`
      :host {
        display: block;
        container-type: inline-size;
      }

      .layout {
        display: grid;
        gap: var(--hb-space-6);
      }

      .toc {
        align-self: start;
        padding: var(--hb-space-4) var(--hb-space-5);
        border: var(--hb-border-width) solid var(--hb-border-color);
        border-radius: var(--hb-radius-l);
        background-color: var(--hb-color-surface-container);
        font-size: var(--hb-text-sm);
      }

      .toc-title {
        margin: 0 0 var(--hb-space-2);
        font: 700 var(--hb-text-md) / 1.3 var(--hb-font-body);
      }

      .toc ol {
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .toc ol ol {
        padding-inline-start: var(--hb-space-3);
      }

      .toc a {
        display: block;
        padding-block: var(--hb-space-1);
        color: inherit;
        text-decoration: none;
      }

      .toc a:hover {
        text-decoration: underline;
      }

      .toc a:focus-visible {
        outline: 3px solid var(--hb-color-focus);
        outline-offset: 2px;
        border-radius: 2px;
      }

      .toc .section {
        font-weight: 700;
      }

      details {
        border-block-end: 1px solid var(--hb-color-outline-variant);
      }

      summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--hb-space-3);
        min-block-size: var(--hb-target-min);
        padding-block: var(--hb-space-3);
        cursor: pointer;
        list-style: none;
      }

      summary::-webkit-details-marker {
        display: none;
      }

      summary::after {
        content: '+';
        flex: none;
        font: 700 var(--hb-text-xl) / 1 var(--hb-font-mono);
      }

      details[open] > summary::after {
        content: '−';
      }

      summary:focus-visible {
        outline: 3px solid var(--hb-color-focus);
        outline-offset: 2px;
        border-radius: var(--hb-radius-s);
      }

      .prose summary h3 {
        margin: 0;
      }

      .answer {
        padding-block-end: var(--hb-space-3);
      }

      @container (width >= 900px) {
        .layout.with-toc {
          grid-template-columns: 16rem minmax(0, 1fr);
        }

        .toc {
          position: sticky;
          inset-block-start: calc(var(--hb-header-height) + var(--hb-space-4));
          max-block-size: calc(100vh - var(--hb-header-height) - var(--hb-space-8));
          overflow-y: auto;
        }
      }
    `,
  ];

  /** The page's path, for the table of contents links. The page has a `<base>`, so `#id` alone would leave it. */
  @property({ attribute: 'page-path' })
  accessor pagePath = '';

  /** Shows each `###` question as a disclosure. */
  @property({ type: Boolean })
  accessor disclosures = false;

  override render() {
    const { html: body, headings } = renderMarkdownWithHeadings(this.content);
    const toc = sections(headings);
    return html`
      <div class="layout ${toc.length ? 'with-toc' : ''}">
        ${
          toc.length
            ? html`<nav class="toc" aria-labelledby="toc-title">
                <h2 class="toc-title" id="toc-title">
                  ${msg('On this page', { id: 'markdown.toc.title' })}
                </h2>
                <ol>
                  ${toc.map(
                    ({ header, subheaders }) => html`
                      <li>
                        ${this.renderLink(header, 'section')}
                        ${
                          subheaders.length
                            ? html`<ol>
                                ${subheaders.map((subheader) => html`<li>${this.renderLink(subheader)}</li>`)}
                              </ol>`
                            : nothing
                        }
                      </li>
                    `,
                  )}
                </ol>
              </nav>`
            : nothing
        }
        <div class="prose">${unsafeHTML(this.disclosures ? withDisclosures(body) : body)}</div>
      </div>
    `;
  }

  private renderLink({ id, text }: MarkdownHeading, className = '') {
    return html`<a
      class="${className}"
      href="${this.pagePath}#${id}"
      @click="${() => this.scrollToId(id)}"
      rel="external"
      >${text}</a
    >`;
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
      element.closest('details')?.setAttribute('open', '');
      scrollToElement(element);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'toc-markdown': TocMarkdown;
  }
}
