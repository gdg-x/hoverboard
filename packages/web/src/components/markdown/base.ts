import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { renderMarkdown } from '../../utils/markdown';
import { ThemedComponent } from '../themed-component';

export class Markdown extends ThemedComponent {
  @property()
  accessor content: string = '';

  override render() {
    return html`<div class="markdown-html">${unsafeHTML(renderMarkdown(this.content))}</div>`;
  }
}
