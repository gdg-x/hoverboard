import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { renderMarkdown } from '../../utils/markdown';
import { prose } from '../../styles/prose';
import { Markdown } from './base';

/** A blog post's text, in the reading layout. */
@customElement('long-markdown')
export class LongMarkdown extends Markdown {
  static override styles = prose;

  override render() {
    return html`<div class="markdown-html prose">${unsafeHTML(renderMarkdown(this.content))}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'long-markdown': LongMarkdown;
  }
}
